# ByBelt Chat — Shopify Billing: Production Deployment Runbook

Scope: shipping the Shopify-managed billing feature (subscription create/upgrade/downgrade/cancel,
webhook + reconcile activation, uninstall revoke) to production (`chat.bybelt.com`, Contabo VPS).

Prod stack reminders:
- Main app (Next.js) + Shopify app (React Router) both deploy via `scripts/deploy-vps.mjs` (tar → scp → docker compose up --build).
- Prod DB is SQLite (`data/bybelt.db`), no migration runner — schema changes are manual `ALTER`.
- Shopify **Partner app config** (webhooks, distribution, URLs) is pushed separately with `shopify app deploy` — `deploy-vps.mjs` does NOT do this.

---

## 0. Pre-flight (do these first; they gate everything)

- [ ] **Public app decided.** Production MUST use a public-distributed app (the custom app `beb2152e…` cannot use the Billing API). Confirm the public app to ship (`5ebccc2e…` "chat bybelt", or a new public app) and that its distribution is **Public** in the Partner dashboard.
- [ ] **Switch app identity in config:**
  - `shopify-app/chat/shopify.app.toml` → `client_id` = public app id.
  - `shopify-app/chat/.env.production` → `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` = public app key/secret.
  - Confirm `application_url = https://chat.bybelt.com/initiate/plugin/shopify`, `embedded = false`, and the `app_subscriptions/update` webhook block are present in `shopify.app.toml`.
- [ ] **Secrets hygiene (blocker):**
  - Add `.env.txt` and `scripts/decrypted-email-env.json` to `.gitignore`; delete them from the working tree.
  - **Rotate** any `shpss_…` secrets that were stored in `.env.txt` (old + new app) — they were on disk in plaintext.
  - Re-run `node scripts/check-tracked-secrets.mjs`; confirm clean.
- [ ] **Bridge secret parity:** `BYBELT_INTERNAL_SECRET` set and identical in BOTH prod envs (main `.env.production` and `shopify-app/chat/.env.production`); `BYBELT_MAIN_INTERNAL_URL` / `SHOPIFY_PLUGIN_INTERNAL_URL` point at the correct in-network ports.
- [ ] **Backfill safety check:** query prod DB for rows that the boot backfill would reset —
  `SELECT workspace_id, plan_tag FROM workspace_subscriptions WHERE plan_tag != 'Free' AND shopify_subscription_id IS NULL;`
  Any rows here will be downgraded to Free on first boot. Confirm that's intended (no legacy simulated-paid customer expecting access without a Shopify sub). If not, resolve before deploy.
- [ ] **Commit the billing changes** on a release branch, ideally separated from the unrelated dirty working-tree files. `npm run check` (lint + typecheck + build) green on main app; `npm run typecheck` + `npm run build` green in `shopify-app/chat`.
- [ ] **Backups taken** (see Deployment step 1).

---

## 1. Deployment checklist (ordered — do not reorder 3→4→5)

1. [ ] **Backup prod DB:** `ssh <vps> "cp <remote>/data/bybelt.db <remote>/data/bybelt.db.pre-billing.$(date +%s)"`. Note the path; needed for rollback.
2. [ ] **Backup current running images / note current commit** deployed (for image rollback).
3. [ ] **Apply schema migration to prod SQLite** (before app boot):
   `ALTER TABLE workspace_subscriptions ADD COLUMN shopify_subscription_id text;`
   Idempotency: skip if the column already exists (`PRAGMA table_info(workspace_subscriptions)`).
4. [ ] **Deploy app code:** `node scripts/deploy-vps.mjs` (builds + ships main app and Shopify app service). Watch for the SSH `kex` drop seen previously — re-run if the build didn't complete.
5. [ ] **Push Shopify Partner app config:** from `shopify-app/chat`, `shopify app deploy -c <config> --force`. This registers the `app_subscriptions/update` webhook, scopes, URLs, and distribution against the public app. (Not done by `deploy-vps.mjs`.)
6. [ ] **Verify reconcile cron is scheduled on the VPS** (the auto-heal safety net if a webhook is lost): the cron invoking `scripts/shopify-reconcile-cron.mjs` (POST `/plugin/shopify/internal/reconcile`) must be active and its `.cron.env` has `BYBELT_INTERNAL_SECRET`.
7. [ ] **Confirm app boot is clean:** main-app startup log shows `configOk: true`, `internal-bridge enabled`, and the `billing:backfill-orphaned-plans` job `job_succeeded`. No `startup_config_error`.
8. [ ] **Smoke the internal activate endpoint** (proves bridge + schema live): with the prod secret, `POST /api/billing/shopify/activate` for a throwaway/test workspace, confirm 200 + DB write, then reset it to Free.

---

## 2. Rollback checklist

Trigger if: billing endpoints 500, webhook/reconcile corrupts plan state, or App Store install breaks.

- [ ] **Re-deploy the previous app images / commit** (main + Shopify app) via `deploy-vps.mjs` from the prior release tag.
- [ ] **Revert the Shopify Partner app config** if the app-identity switch caused install breakage: `shopify app deploy` the previous config, or roll the app version back in the Partner dashboard. (If you switched to the public app and must revert to the custom app, expect that billing is disabled on the custom app — this is a forward-only decision; prefer fixing forward.)
- [ ] **Schema:** the `shopify_subscription_id` column is **nullable/additive** — safe to LEAVE in place on rollback (old code ignores it). Do NOT drop it. Only restore `data/bybelt.db.pre-billing.*` if plan data was corrupted, after stopping the app.
- [ ] **Code-revert caveat:** `src/lib/billing/upgrade-plan.ts` was deleted and the PATCH simulation removed. A pure `git revert` of the billing PR restores them; a partial rollback that keeps the new UI but reverts the API will break the upgrade path. Roll back the whole PR, not pieces.
- [ ] **If a bad plan state was written:** run the reconcile once (`POST /plugin/shopify/internal/reconcile`) — it re-derives every linked workspace's plan from live Shopify and self-heals. This is preferred over DB surgery.
- [ ] **Secrets:** if rotation happened during deploy, confirm the running app uses the rotated secret before declaring rollback complete.
- [ ] **Post-rollback:** confirm `GET /api/billing/plans` returns and a linked workspace shows its correct plan.

---

## 3. Post-deployment verification checklist

Run against prod using a **Shopify development store** (test charges, no real money). App-level `app_subscriptions/update` should reach the deployed app (same host), so the real-time path is testable here — unlike the local tunnel.

**Install / OAuth**
- [ ] Install the app on a dev store → OAuth completes, offline session stored, shop linked to a workspace.
- [ ] `GET /api/billing/plans` for that workspace returns `Free`.

**Subscribe (real-time webhook path)**
- [ ] Choose Plus → Shopify approval screen shows correct plan + price → Approve.
- [ ] Confirm the **`app_subscriptions/update` webhook lands on prod** (Shopify-app log: `Received app_subscriptions/update`) — this is the piece unproven in dev.
- [ ] Main-app log shows the `shopify_billing_activate` bridge call; DB row = `Plus / Active / 9500 / shopify_subscription_id set / analytics=1 / helpdesk=1`.

**Upgrade / downgrade / cancel**
- [ ] Upgrade Plus→Pro: approval says "Replaces previous subscription"; DB → Pro/25000; no transient Free.
- [ ] Downgrade Pro→Essentials: DB → Essentials/2500, `helpdesk_enabled=0`.
- [ ] Cancel (Switch to Free): DB → Free/Inactive, flags cleared, `shopify_subscription_id` null.

**Reconcile / missed-webhook safety net**
- [ ] With an active paid sub, delete/skip the webhook path and run `POST /plugin/shopify/internal/reconcile` → DB converges to the live Shopify plan. Confirm the scheduled cron ran at least once (log `reconciliation_complete` with `billingReconciledCount`).

**Uninstall**
- [ ] Uninstall the app on the dev store → `app/uninstalled` → workspace revoked to Free, ShopLink + session deleted.

**Backfill (migration)**
- [ ] Confirm boot `billing:backfill-orphaned-plans` ran and did not wrongly downgrade any real paying customer (cross-check against the pre-flight query).

**Security / IDOR**
- [ ] `PATCH /api/billing/plans` uses the session workspace only (a forged `workspaceId` in the body is ignored); an unlinked workspace gets the "connect Shopify" `not_linked` response, and a bridge outage gets `503 bridge_unavailable` (not a false "not linked").
- [ ] `POST /api/billing/shopify/activate` without the internal secret → 401.

**Source-of-truth invariant**
- [ ] Grep confirms no code path other than `/api/billing/shopify/activate` writes a paid `Active` status; `GET /api/billing/plans` reflects the DB, which reflects Shopify.

---

## Known non-blocking gaps to track (not required to deploy, flag for the next sprint)

- No rate limiting on billing/auth/internal endpoints (app, middleware, nginx).
- App is `embedded = false` — allowed for App Store listing but not "Built for Shopify"; revisit before store submission.
- `paymentMethods` / invoices tables are now vestigial (not wired to Shopify billing).
