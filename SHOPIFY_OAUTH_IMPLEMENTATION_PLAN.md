# Shopify OAuth Flow — Resilience Analysis & Implementation Blueprint

**Task:** M2-T1 — Shopify OAuth Flow Resilience Audit
**Role:** Lead Shopify Platform Engineer
**Status:** Understanding phase — NO CODE CHANGED. This is the blueprint for the next coding phase.
**Date:** 2026-07-03

> **Critical architectural fact discovered:** The Shopify OAuth flow does **not** live in the Next.js app (`chat.bybelt.com` :3004). It lives in a **separate React Router (Remix-lineage) companion app** at `shopify-app/chat/` (:3005), built on `@shopify/shopify-app-react-router` + `@shopify/shopify-api`, with its **own Prisma/SQLite database** (`prisma/dev.sqlite`) that is fully independent of the main app's Drizzle DB. The two apps communicate over an internal HTTP bridge secured by `BYBELT_INTERNAL_SECRET`. This is a two-database, two-runtime system, which is the single most important context for everything below.

---

## 1. System Topology

| Layer | Runtime | DB | Responsibility |
|---|---|---|---|
| Main app (`:3004`) | Next.js 16 | Drizzle (SQLite/Postgres) | Inbox, contacts, workspaces, sessions, `/api/integrations/shopify/*` internal endpoints |
| Shopify app (`:3005`) | React Router + `@shopify/shopify-app-react-router` | **Prisma / SQLite** (`Session`, `ShopLink`) | OAuth, token storage, webhook receipt, metafield writes, plugin admin UI |
| Bridge | HTTP + `X-Bybelt-Internal-Secret` | — | Shopify app → main app (`upsert contact`, `linked`, `uninstalled`, `redact`, sync) |

**Nginx** (`deploy/nginx/chat.bybelt.com.conf`) fronts both: `/auth/`, `/plugin/`, `/webhooks/*`, `/initiate/plugin/shopify` → :3005; everything else → :3004.

**Config source of truth:** `shopify.app.toml` — `client_id beb2152e…`, `embedded = false`, scopes `read_customers,read_orders,read_products,read_content,read_themes,read_fulfillments`, 14 webhook topics, callback URLs `/auth/callback` + `/auth/shopify/callback`.

---

## 2. Step-by-Step Trace

### Step 1 — Shopify Install
- **Entry:** Merchant installs from Shopify Admin / App Store. `application_url = https://chat.bybelt.com/initiate/plugin/shopify`. Because `embedded = false`, the app renders standalone (not in an Admin iframe).
- **Files:** `shopify.app.toml`, `routes/initiate.plugin.shopify.tsx`.
- **Failure/recovery:** If the merchant lands on `/initiate/plugin/shopify` without a valid Shopify session, `authenticatePluginAdmin` (loader line 54) drives them into OAuth. No dedicated install landing page.

### Step 2 — OAuth Begin
- **Implementation:** **Custom**, not the library's stock `/auth` handler. `routes/auth.$.tsx` → `handleShopifyOAuthBegin` (`plugin-auth.server.ts:111`). It sanitizes `shop` (`sanitizeShop`, appends `.myshopify.com`, `shopifyApiClient.utils.sanitizeShop(..., true)`), then `redirectToShopifyOAuth` calls `shopifyApiClient.auth.begin({ isOnline:false, callbackPath:"/auth/callback" })` and manually re-throws the 302 `Location` (offline tokens).
- **Functions:** `shopFromRequest`, `sanitizeShop`, `redirectToShopifyOAuth`, `handleShopifyOAuthBegin`.
- **Security:** `auth.begin` sets the OAuth `state` nonce cookie; shop is sanitized before use (SSRF/open-redirect guard). Offline token (`isOnline:false`).
- **Failure/recovery:** Missing `shop` → calls `login(request)` then throws `400 "Missing shop parameter"` (line 114–115) — **dead code after `login`; the 400 likely never surfaces cleanly**. No explicit handling if `auth.begin` throws (bad API key, Shopify unreachable) → unhandled 500.

### Step 3 — Callback
- **Implementation:** `auth.$.tsx` loader checks `pathname === "/auth/callback"` → `handleShopifyOAuthCallback` (`plugin-auth.server.ts:93`). Note: `shopify.app.toml` registers **two** callback URLs (`/auth/callback` AND `/auth/shopify/callback`) but the code only branches on `/auth/callback` — `/auth/shopify/callback` would fall through to `handleShopifyOAuthBegin` (re-loop).
- **Security:** `shopifyApiClient.auth.callback` validates HMAC + `state` nonce + shop. This is the library's responsibility and is sound.
- **Failure/recovery:** If HMAC/state invalid → library throws; **no try/catch** here → unhandled 500, no user-facing recovery.

### Step 4 — Token Exchange
- **Implementation:** Inside `auth.callback({ expiring:true })` — exchanges `code` for an **expiring offline access token** (`future.expiringOfflineAccessTokens:true` in `shopify.server.ts`, so `Session` carries `refreshToken`/`refreshTokenExpires`).
- **Storage:** `sessionStorage.storeSession(callback.session)` → `PrismaSessionStorage` → Prisma `Session` table (`accessToken`, `scope`, `expires`, `refreshToken`).
- **Failure/recovery:** If token exchange fails → 500. If `storeSession` DB write fails → **token is lost, no retry**; merchant must reinstall.

### Step 5 — "Store Creation" (Shop Link)
- **Important:** There is **no store record created at OAuth time.** OAuth only stores a `Session`. The `ShopLink` (shop ↔ Bybelt workspace) is created **later**, only after the merchant authenticates to Bybelt and picks a workspace.
- **Implementation:** `initiate.plugin.shopify.tsx` loader/action → `upsertShopLink` (`shop-link.server.ts:19`). It: (a) writes 3 shop metafields via `saveBybeltShopSettings` (GraphQL `metafieldsSet`), (b) upserts Prisma `ShopLink`, (c) fire-and-forget `triggerMainAppContactSync` + (first link only) `notifyMainAppShopifyLinked`.
- **Failure/recovery:** Metafield write happens **before** the DB upsert — if metafields succeed but the `ShopLink` upsert fails, metafields are set with no local link (partial state). Bridge calls are `void … .catch(()=>undefined)` — **silently swallowed**; a failed `notifyMainAppShopifyLinked` means the main app never fires `integration:shopify_linked` and no one knows.

### Step 6 — Session Creation (dual meaning)
- **Shopify session:** created in Step 4 (Prisma `Session`).
- **Bybelt session:** separate. `fetchBybeltSession` (`bybelt-auth.server.ts:21`) forwards the browser `Cookie` to the **main app** `/api/auth/workspace`. If unauthenticated → `throwBybeltLoginRedirect` bounces to `chat.bybelt.com/initiate/login?next=…`.
- **Failure/recovery:** For **already-linked** stores the loader (line 60–65) **skips the Bybelt cookie entirely** ("unavailable in Admin iframe") and redirects straight to settings — Shopify OAuth alone is treated as sufficient authz. For **new** links, both a Shopify session AND a Bybelt cookie are required, coupling two independent auth systems in one flow.

### Step 7 — Webhook Registration
- **Implementation:** Two registration paths, both fire: (a) `shopify.server.ts` `hooks.afterAuth` → `registerWebhooks({session})`; (b) `handleShopifyOAuthCallback` **also** calls `registerWebhooks({session})` explicitly (line 102). Topics come from `shopify.app.toml` (declarative) — the app-specific + compliance webhooks are declared there; `SHOPIFY_WEBHOOK_TOPICS` (14) in `shopify-webhooks.server.ts` is a **parallel hardcoded list used only for counting**, not for registration.
- **Failure/recovery:** `registerWebhooks` failure in the callback is **not caught** → 500 after token already stored (partial success: authed but webhooks maybe unregistered). No retry, no reconciliation job. Declared (TOML) vs. code-counted (14) topic lists can **drift** silently.

### Step 8 — Redirect
- **New link:** → `/plugin/shopify/settings?shop=…&onboard=1`.
- **Callback:** → `/initiate/plugin/shopify?shop=…` (URL-encoded shop).
- **Failure/recovery:** Redirect headers merged from `callback.headers` (carries Set-Cookie for session). If a downstream loader throws during the redirect target render, merchant sees an error page with a live session but no clear resume path.

### Step 9 — Dashboard (Settings)
- **Implementation:** `routes/plugin.shopify.settings.tsx` (not fully traced here) — the post-link operator surface. Reached via `authenticatePluginAdmin`.

---

## 3. Failure Point Register

Legend — Likelihood: Low / Med / High. Impact: Low / Med / High / Critical.

| # | Failure Point | Risk | Impact | Likelihood | Recommended Direction (no code here) |
|---|---|---|---|---|---|
| F1 | **Two databases, no cross-DB transaction** (Prisma `ShopLink` vs. main-app Drizzle contacts/webhooks) | Partial link state: local link exists but main app never notified, or vice-versa | High | Med | Make `notifyMainAppShopifyLinked` reliable (retry + persisted outbox), and add a reconciliation job comparing `ShopLink` rows to main-app link state. |
| F2 | **Fire-and-forget bridge calls swallow all errors** (`shop-link.server.ts:39,41`; `void … .catch(()=>undefined)`) | Linked event / contact sync silently never happens | High | High | Persist bridge intents to an outbox table; retry with backoff; surface failures to logs/alerts (ties to M2-T3 dead-letter). |
| F3 | **Webhook registration not idempotent-safe on failure** (Step 7, no try/catch, dual registration) | Store authed but missing webhook subscriptions → stale inbox forever | High | Med | Wrap registration in retry; add a health check that diffs registered vs. declared topics and re-registers; single source of truth for topic list. |
| F4 | **Metafield write precedes DB upsert** (`upsertShopLink`) | Metafields set on Shopify with no local `ShopLink` → orphaned config | Med | Med | Order operations so local truth is written first, or make the pair atomic/compensating; treat metafield write as reconcilable. |
| F5 | **Merchant closes browser mid-flow** (after OAuth, before workspace pick) | `Session` exists, no `ShopLink` → store authed but unlinked, no widget | Med | High | Detect "authed but unlinked" on next visit (loader already routes to link step — verify it always resumes); add a nudge/empty-state. Currently *mostly* handled by the loader re-entry, but no proactive recovery. |
| F6 | **Expired/replayed OAuth `state` nonce** | OAuth fails on slow completion or double-submit | Med | Med | Library handles state; ensure the callback error path renders a "restart install" page instead of a raw 500. |
| F7 | **`/auth/shopify/callback` registered in TOML but unhandled in code** | If Shopify ever calls the second callback URL, it loops back to OAuth begin | Med | Low | Either handle both callback paths or remove the second from `shopify.app.toml`. |
| F8 | **Dead code in `handleShopifyOAuthBegin`** (`login()` then unreachable 400) | Missing-shop requests get ambiguous behavior | Low | Low | Define a real missing-shop UX (install landing page). |
| F9 | **Token exchange succeeds, `storeSession` DB write fails** | Access token lost; silent reinstall required | High | Low | Retry the session write; on failure return a clear "try again" rather than 500. |
| F10 | **Duplicate / concurrent install** (two tabs, or reinstall) | Race on `ShopLink` upsert + double `shopify_linked` events | Med | Med | `upsert` guards the row, but the "first link" branch (`if (!existing)`) is **check-then-act, not atomic** → two concurrent first-links can both fire `linked`. Guard with a unique constraint / conditional write. |
| F11 | **Reinstall after uninstall** | Uninstall deletes `Session` + `ShopLink` (`webhooks.app.uninstalled`); reinstall must re-link from scratch | Med | High | Confirm reinstall cleanly re-drives workspace selection; consider retaining `workspaceId` to offer "relink to previous workspace." Currently the prior workspace association is destroyed on uninstall. |
| F12 | **Scope changes** (`app/scopes_update`) | Only updates `Session.scope` string; no re-validation that new scopes cover feature needs | Low | Med | On scopes_update, verify required scopes still present; flag degraded stores. |
| F13 | **App reinstall with stale metafields** | Old `bybelt.*` metafields persist across uninstall (Shopify keeps shop metafields) | Low | Med | On relink, reconcile/overwrite metafields (already overwritten by `saveBybeltShopSettings`, but verify against a different workspace choice). |
| F14 | **Shop not found / sanitize returns null** | `authenticatePluginAdmin` throws redirect to `/auth/login` | Low | Low | Acceptable; ensure `/auth/login` renders usefully. |
| F15 | **Main app unreachable during link** (`fetchBybeltSession`, `triggerMainAppContactSync`) | Link proceeds (fire-and-forget) but sync/notify fails silently | Med | High | Distinguish "must succeed" (link notification) from "best effort" (initial sync); retry the former. |
| F16 | **`BYBELT_INTERNAL_SECRET` misconfigured / mismatched between apps** | Every bridge call 401s; links never register in main app | Critical | Med | Fail-fast boot check on both apps (ties to M6-T1 central config); today `bridgeConfig()` throws only at call time and `triggerMainAppContactSync` returns a soft error. |
| F17 | **`unauthenticated.admin(shop)` token expired mid-session** | Metafield write 401 → `reauthorizeShopify` clears sessions + re-OAuths | Low | Med | Already handled via `isShopifyUnauthorizedError` + `reauthorizeShopify`; verify it doesn't infinite-loop on persistent 401. |
| F18 | **Uninstall webhook runs before link fully written** | `deleteMany` finds nothing; main app never told of uninstall if `ShopLink` absent | Low | Med | Idempotent uninstall handling (already `deleteMany` + `.catch`); ensure main-app uninstall notify tolerates missing link. |
| F19 | **Prisma SQLite single-file DB under concurrency** (`:3005`) | Write contention / lock under many simultaneous installs | Med | Low (now) / High (scale) | For scale, move Shopify app session store off single-file SQLite (Postgres/managed). Not launch-blocking at low volume. |
| F20 | **No HMAC/verification on the internal bridge beyond a shared static secret** | If secret leaks, main-app integration endpoints are fully open | High | Low | Rotate-able secret, per-request signing, or network isolation; today it's a single static `X-Bybelt-Internal-Secret` compared with `===`. |

---

## 4. Cross-Cutting Observations

1. **Idempotency is uneven.** Uninstall is idempotent (`deleteMany`); first-link notification is not (F10). Webhook *processing* idempotency (M2-T2) is a separate, still-open concern.
2. **No retry/outbox anywhere in the link path.** Every main-app notification is `void fetch().catch()`. This is the highest-leverage fix and directly feeds M2-T3 (retry + dead-letter).
3. **Two topic lists** (declarative TOML vs. `SHOPIFY_WEBHOOK_TOPICS` count constant) can drift — no single source of truth.
4. **Dual auth coupling.** New-store linking requires BOTH a valid Shopify session AND a Bybelt browser cookie in the same request; linked stores bypass Bybelt auth entirely. The asymmetry is intentional (iframe cookie limits) but under-documented and a security surface worth an explicit decision.
5. **Partial-success windows** exist between: token stored ↔ webhooks registered ↔ metafields written ↔ ShopLink upserted ↔ main app notified. None are transactional; there is no reconciliation job to detect or heal drift.
6. **Error UX is mostly raw 500s.** OAuth begin/callback/register have no try/catch that produces a "restart install" experience.

---

## 5. Recommended Blueprint for the Coding Phase (direction only — no implementation)

Priority order for M2-T1 follow-on work, mapped to master-plan tasks:

1. **Reliability of link notification (F2, F15, F16)** → introduce a persisted outbox + retry for `notifyMainAppShopifyLinked` and `triggerMainAppContactSync`. *Feeds M2-T3.*
2. **Atomic first-link + idempotent linking (F10, F4)** → make "first link" detection atomic; write local truth before external side effects; treat metafields as reconcilable. *Feeds M2-T2.*
3. **Webhook registration resilience + single topic source (F3)** → retry registration, add a diff-and-repair health check, collapse the two topic lists. *Feeds M2-T2/M2-T5.*
4. **OAuth error UX (F6, F8, F9)** → wrap begin/callback/token-store in handlers that render a "restart install" page instead of 500.
5. **Reconciliation job (F1, F5, F11)** → a periodic sweep comparing Prisma `ShopLink` ↔ main-app link state ↔ Shopify session presence; heal "authed-but-unlinked" and "linked-but-unnotified." *Feeds M2-T5.*
6. **Config fail-fast for `BYBELT_INTERNAL_SECRET` on both apps (F16, F20)** → *Feeds M6-T1.*
7. **Callback URL consistency (F7)** → reconcile `shopify.app.toml` with `auth.$.tsx`.
8. **Reinstall workspace retention (F11)** → decide whether to preserve prior `workspaceId` for one-click relink.

**Explicitly out of scope for this task (postpone):** moving the Shopify app off single-file SQLite (F19 — scale, not launch), and deeper GDPR-webhook correctness (owned by M2-T4).

---

## 6. Evidence Index (files inspected)

- `shopify-app/chat/shopify.app.toml` — app config, scopes, webhooks, callbacks
- `shopify-app/chat/app/shopify.server.ts` — `shopifyApp()` config, `afterAuth` webhook registration
- `shopify-app/chat/app/lib/shopify-api.server.ts` — raw `shopifyApi` client, `SHOPIFY_AUTH_CALLBACK_PATH`
- `shopify-app/chat/app/routes/auth.$.tsx` — begin/callback router
- `shopify-app/chat/app/lib/plugin-auth.server.ts` — custom begin/callback/reauthorize logic
- `shopify-app/chat/app/routes/initiate.plugin.shopify.tsx` — workspace linking flow
- `shopify-app/chat/app/lib/shop-link.server.ts` — `ShopLink` upsert + bridge triggers
- `shopify-app/chat/app/lib/shop-settings.server.ts` — metafield read/write (GraphQL)
- `shopify-app/chat/app/lib/bybelt-auth.server.ts` — main-app session bridge
- `shopify-app/chat/app/lib/bybelt-main.server.ts` — internal HTTP bridge client
- `shopify-app/chat/app/lib/shopify-webhooks.server.ts` — topic count constant
- `shopify-app/chat/app/lib/webhook-route.server.ts`, `shopify-errors.server.ts`
- `shopify-app/chat/app/routes/webhooks.app.uninstalled.tsx`, `webhooks.app.scopes_update.tsx`
- `shopify-app/chat/app/db.server.ts`, `prisma/schema.prisma`, `prisma/migrations/*`
- `src/app/api/integrations/shopify/linked/route.ts`, `src/lib/auth/internal-request.ts`

PHASE 5 COMPLETE
