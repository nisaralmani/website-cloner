# Bybelt — Final Engineering Review (Pre-Launch)

**Reviewer role:** Principal Staff Engineer / Final Architecture Reviewer
**Method:** Direct repository inspection + cross-reference against the four prior audits (Architecture Review, Shopify OAuth Blueprint, Order Context Blueprint, AI Reply Blueprint). Read-only. Every finding below is anchored to a file in the tree.
**Date:** 2026-07-03
**Verdict up front:** **DO NOT LAUNCH TO PAID MERCHANTS TODAY.** Rationale and minimum blockers at the end.

> Scope note: findings are evidence-based. Where I could not fully trace runtime behavior in a read-only pass, I say so rather than assert. Prior-audit findings are re-confirmed against current code, not copied on trust — several have since been partially fixed (e.g. the hardcoded `STORE_POLICY` is now per-workspace grounding), and those deltas are noted.

---

## 1. Architecture

**Confirmed against current tree:**
- **No repository/data-access layer.** 121 of 139 route handlers call `getDb()` directly (Architecture Review §2.1). Tenant scoping is convention-only — a single missing `.where(eq(table.workspaceId, …))` is a silent cross-tenant leak with no structural guard. Verified pattern in `src/app/api/billing/cards/route.ts` (scopes by `userId`), `src/app/api/contacts/route.ts`.
- **Dual hand-synced schemas + unsafe cast.** `schema.sqlite.ts` / `schema.pg.ts` (~580 LOC each) bridged by `drizzlePostgres(...) as unknown as SqliteDb` in `src/db/client.ts`; `schema.ts` re-exports the SQLite variant only. Divergence surfaces as a **runtime** SQL error in production, never at compile time.
- **No central validated config.** Raw `process.env.*` reads scattered across the tree (`OPENAI_API_KEY`, `BYBELT_INTERNAL_SECRET`, `OPENAI_MODEL`, `DATABASE_URL`). Only `SESSION_SECRET` fails fast (`session.ts:15`). Everything else fails deep inside a request or silently degrades.
- **God components:** `SettingsDetail.tsx` (4,217 LOC), `settings-registry.ts` (1,837), `AnalyticsPanel.tsx` (1,330), `useConversations.ts` (1,066). Real maintainability debt; not launch-blocking on their own.
- **Duplicated data-fetching:** ~50 hooks hand-roll identical `useState/useCallback/fetch` blocks; no `swr`/`react-query`. Maintainability, not correctness.

**New AI-layer coupling (post-M4 partial work):** orchestration is now centralized in `src/lib/ai/orchestrator.ts` (`processAiReply`) and a channel-agnostic `src/lib/ai/decision-engine.ts` wraps the email engine — but **chat still bypasses the decision engine** (by design, deferred). The two pipelines share generation and grounding but not gating.

---

## 2. Shopify

Two-runtime, two-database system (`shopify-app/chat` on :3005 with its **own Prisma/SQLite DB**, main app on :3004 with Drizzle). All cross-app calls go over a static-secret HTTP bridge. This is the single most important operational fact.

**Confirmed:**
- **OAuth is custom**, offline (`isOnline:false`), expiring tokens with refresh. HMAC + `state` nonce validated by the library (sound). Shop is sanitized (`sanitizeShop`) — good SSRF/open-redirect guard.
- **Fire-and-forget bridge calls swallow all errors** (`shop-link.server.ts`: `void … .catch(()=>undefined)`). A failed `notifyMainAppShopifyLinked` means the main app is never told a store linked, with no signal (OAuth Blueprint F2).
- **First-link detection is check-then-act, not atomic** (`if (!existing)`) — concurrent installs can double-fire `linked` (F10).
- **Webhook registration not wrapped in retry/try-catch** in the callback; declared TOML topics vs. the hardcoded `SHOPIFY_WEBHOOK_TOPICS` count constant can drift (F3).
- **`/auth/shopify/callback` is registered in `shopify.app.toml` but unhandled in `auth.$.tsx`** — falls through to OAuth begin, re-loop (F7).
- **Reinstall destroys the prior workspace association** (`webhooks.shop.redact` / uninstall `deleteMany`) — merchant must re-link from scratch (F11).

**GDPR (App Store gating) — verified handlers exist and are HMAC-authenticated:**
- `webhooks.customers.redact.tsx` → `redactMainAppShopifyCustomer` (awaited — good, a throw makes Shopify retry).
- `webhooks.customers.data_request.tsx` → `notifyMainAppShopifyDataRequest` (**notify-only**; whether an actual data export is produced within Shopify's 30-day window is unverified in this pass — this is an App-review risk to confirm).
- `webhooks.shop.redact.tsx` → redact + uninstall notify + delete sessions + delete `ShopLink`.
- **Reliability caveat:** all three depend on the bridge and the main app's actual deletion logic. If `BYBELT_INTERNAL_SECRET` is mismatched, redacts 401 and Shopify retries indefinitely — the *webhook* is correct but data may never actually be erased. **Provable, end-to-end data removal must be demonstrated before App submission** (M2-T4).

**App-review readiness:** likely **rejected today** — GDPR data-erasure not provably complete end-to-end, install flow has raw-500 error paths (no "restart install" UX), and webhook registration can silently partial-fail.

---

## 3. AI

**Fixed since the AI Blueprint:** the hardcoded generic `STORE_POLICY` is gone — replaced by per-workspace `resolveMerchantGrounding` (`src/lib/ai/merchant-grounding.ts`), which falls back to a labeled default. Grounding is now the single source for both channels. Audit logging now emits a structured event for **both** chat and email via `recordAiAudit` (`src/lib/ai/audit-log.ts`).

**Still open and material:**
- **Chat has no confidence gate, no decision engine, no escalation** (`ai-auto-reply.ts` → `processAiReply` → unconditional send). The primary channel M3 was built for is the least-governed. An angry/fraud-risk chat message gets an unconditional AI reply.
- **Prompt injection via customer-controlled Shopify `displayName`** interpolated unsanitized into the **system** prompt (`ai-reply.ts` `formatShopifyCustomerContext`). A shopper who sets their display name to an instruction string injects it into their own conversation's system prompt. (Blueprint A4 — not yet fixed.)
- **Audit is console-only** (`console.info("[ai-audit]", …)`) — not queryable, not persisted, no per-workspace metering. Adequate as a seam, insufficient for billing/quality dashboards.
- **Synchronous blocking:** the chat AI call (OpenAI + live Shopify pull) runs inside the visitor's `POST /messages` request (Blueprint A5). Every AI-branch message pays full LLM+Shopify latency inline.
- **Single global `OPENAI_API_KEY`** shared by all tenants — noisy-neighbor rate-limit/cost risk; no per-workspace metering (blocks M5-T4).
- **Template fallback is indistinguishable from an outage** — every `catch` falls to a static template; a provider 5xx silently degrades reply quality with no signal.
- **Unbounded conversation history** sent to the model on every reply (`selectConversationMessages`, no LIMIT).

**Hallucination posture:** materially improved (real per-merchant policy now), but the chat channel can still state confident answers with zero gating; combined with prompt injection, this is the highest-severity AI risk.

---

## 4. Order Context

Confirmed against the Order Context Blueprint — all central weaknesses persist:
- **Dual source of truth never reconciled** (W1): stored `conversation_visitor_data` (webhook push) vs. live GraphQL pull. UI shows both; AI trusts only live. They can silently disagree.
- **No cache on the live path** (W2): `cache:"no-store"` at every hop; a live Shopify GraphQL round-trip on every conversation open **and** every AI reply. Hits rate limits at scale.
- **No timeout on the Shopify leg** (Blueprint A16): `shopify-context.ts` uses raw `fetch`. Combined with §3's synchronous chat path, a hung plugin/Shopify call can stall the visitor's request past the 8s OpenAI bound.
- **Stale stored data, no TTL** (W3); **orders arriving before a conversation exists are dropped** (W4); **email casing/whitespace breaks linkage** (W5); **silent 500-customer sync cap** (W6) — larger (higher-value) merchants get incomplete coverage with no signal.
- **Enrichment is not transactional** (W9); **multi-store workspaces resolve an arbitrary `ShopLink`** (W10); **all live-pull failures swallowed to `null`** (W12) — no observability into why context is missing.

---

## 5. Billing

**Billing is entirely mock. This is the clearest launch blocker for a paid product.**
- `Stripe` appears only in marketing-content files (`marketing-integrations-data.ts`, `marketing-pricing-compare.ts`) — **no payment SDK, no charge, no webhook**.
- `src/app/api/billing/cards/route.ts` stores `label/brand/last4` only; POST accepts an **empty body** and uses `defaultMockPaymentMethod()`. Card add is a UI fiction.
- **No subscription lifecycle, no plan-gating enforcement, no failed-payment/dunning, no proration on upgrade/downgrade, no AI-usage metering.** Master Plan M5 (all of it) is unbuilt.

There is no path to revenue and no way to enforce plan limits today.

---

## 6. Security

**Solid:**
- **Session:** JWT HS256 via `jose`, `httpOnly`, `sameSite:lax`, `secure` + `domain:.bybelt.com` in prod, server-side revocation check (`isUserSessionRevoked`), `SESSION_SECRET` required in prod (`session.ts`). This is well done.
- **SQL injection:** not found. All dynamic queries use Drizzle parameterized tagged templates (`sql\`lower(${col}) like ${\`%${q}%\`}\`` binds `q` as one parameter). No `sql.raw` with user input.
- **XSS:** no `dangerouslySetInnerHTML` in app code (only two marketing-data modules).
- **SSRF:** shop domain sanitized before Shopify calls.
- **CSRF:** relies on `sameSite:lax` + JSON APIs (acceptable modern posture; no token layer).

**Weak / open:**
- **Internal bridge auth is a single static shared secret compared with `===`** (`internal-request.ts:10`) — not constant-time, not rotatable, not per-request-signed. If it leaks, every internal integration endpoint is fully open (OAuth Blueprint F20).
- **Tenant isolation is convention-only** across 121 direct-DB routes — structural leak risk (Architecture Review #1/#9). No automated cross-tenant test in place.
- **Fail-open DB config:** `dialect.ts` silently defaults to `data/bybelt.db` SQLite if `DATABASE_URL` is unset — and the prod compose (§7) actively mounts a `./data` volume, so a misconfigured prod deploy runs on single-file SQLite instead of refusing to boot.
- **Prompt injection** (§3, A4) — unsanitized customer field in system prompt.

---

## 7. Operations

**This is the weakest category and is under-weighted by the prior architecture-focused audits.**
- **No health check anywhere.** No `HEALTHCHECK` in `Dockerfile`, no `/api/health` route, no readiness/liveness probe. An orchestrator cannot tell if the app is alive or wedged.
- **`docker-compose.prod.yml` defines only the `chat` app — no Postgres, no Redis, no shopify-app service.** With `env_file: .env.production` and a `./data:/app/data` volume, the default production topology is **single-instance SQLite + in-memory pub/sub**. That is consistent with the "10–100 tenant" ceiling but is not a scalable or HA production posture, and it makes the fail-open SQLite path (§6) the *likely* default rather than an edge case.
- **No structured logging / error tracking.** Logging is `console.log`/`console.info` (including the new `[ai-audit]` line and every Shopify webhook `console.log`). No Sentry/OTel, no request correlation, no error aggregation.
- **No backup strategy in the repo** for either the Drizzle DB or the Shopify app's Prisma SQLite (`prisma/dev.sqlite`) — the token store lives in a single file with no documented backup.
- **Rollback:** image redeploy is straightforward, but there is **no DB migration rollback strategy**, and the dual hand-synced schema means a forward migration applied to one dialect and not the other is unrecoverable without manual intervention.
- **Observability of the core loop** (install → webhook → AI reply) is absent — the very failures most likely to occur (bridge 401s, swallowed link notifications, template-fallback AI) are invisible.

---

## 8. Scalability (realistic limits + first bottleneck)

| Tenants | Verdict | First bottleneck to appear |
|---|---|---|
| **10** | ✅ Fine as-is | None. Single instance, `max:10` pool, in-memory pub/sub all comfortable. |
| **100** | ⚠️ Workable, warning signs | **Uncached live Shopify pulls** (order-context W2) — every inbox open + every AI reply is a live GraphQL round trip; Shopify API latency/rate-limit becomes the felt ceiling before the DB does. |
| **1,000** | ❌ Breaks without rework | **`max:10` pool + optional Redis.** Horizontal scaling is required here; each instance opens its own uncoordinated 10-connection pool, and multi-instance realtime **silently breaks** without mandatory Redis (in-memory pub/sub is per-process). Plus no cache tier to absorb SSE-tick re-queries. |
| **10,000** | ❌ Structural rework required | **Single Postgres primary, no replicas/sharding, polling-under-SSE.** One DB is both the throughput ceiling and SPOF; the SSE-per-tab server-held polling loop doesn't scale to tens of thousands of connections. Needs read-scaling + a push-native realtime transport. |

---

## 9. Launch Readiness Scores (0–10)

| Category | Score | One-line justification |
|---|---:|---|
| Architecture | 5 | Functionally real, honestly built; no data-access layer + dual-schema cast are structural liabilities. |
| Shopify | 4 | OAuth core is sound; bridge reliability, partial-success windows, and GDPR end-to-end proof are not launch-ready. |
| AI | 4 | Grounding + audit seam are real progress; chat ungated, prompt injection open, audit not persisted, sync-blocking. |
| Security | 5 | Session/SQLi/XSS/SSRF are good; static-secret bridge, convention-only tenant isolation, fail-open DB drag it down. |
| Billing | 1 | Entirely mock. No revenue path, no enforcement. |
| Operations | 2 | No health checks, no error tracking, no backups, fail-open prod config, no migration rollback. |
| Reliability | 3 | Swallowed errors, non-transactional enrichment, template-fallback masking outages, no core-loop observability. |
| Developer Experience | 6 | TypeScript strict, clean skill/agent tooling, CI guards; but God files and dual schema hurt. |
| Merchant Experience | 5 | The wedge (order context in inbox) is compelling when it works; stale/divergent data and raw-500 install paths undercut trust. |

---

## 10. Top 20 Launch Risks

Severity (S) / Likelihood (L): C=Critical/H=High/M=Med/L=Low.

| # | Risk | S | L | Business impact | Root cause | Milestone |
|---|---|---|---|---|---|---|
| 1 | **Cross-tenant data leak** from a route missing `workspaceId` scoping | C | M | Catastrophic — one leak ends the company | Convention-only isolation across 121 direct-DB routes; no structural guard/test | M1-T4/T5 |
| 2 | **Billing is mock — no revenue, no plan enforcement** | C | H (certain) | Cannot charge or gate; product is free by accident | M5 unbuilt; card flow is a UI fiction | M5-T2/T3 |
| 3 | **GDPR erasure not provably complete → App Store rejection** | C | H | No distribution; blocks the entire go-to-market | Redact webhooks forward over an unreliable bridge; data_request is notify-only | M2-T4 |
| 4 | **Fail-open prod DB → silent SQLite in production** | C | M | Data loss / tenant commingling on a misconfig | `dialect.ts` defaults to `data/bybelt.db`; prod compose mounts `./data`, no Postgres service | M6-T2 |
| 5 | **Schema drift (pg vs sqlite) → runtime SQL error in prod** | C | M | Production outage from a missed dual-edit | Two hand-synced schemas + `as unknown as` cast | M1-T2/T3 |
| 6 | **Prompt injection via Shopify display name into system prompt** | H | M | AI coerced (e.g. "issue a refund"); brand/legal | Unsanitized customer field in system role (`ai-reply.ts`) | M4 (A4) |
| 7 | **Chat AI ungated — unconditional autonomous replies** | H | H | Wrong/aggressive replies on the primary channel | Chat bypasses the decision engine by design | M4-T3/T4 |
| 8 | **Bridge secret mismatch → links/redacts/enrichment silently 401** | H | M | Stores appear linked but aren't; GDPR retries forever | Static `===` secret, no boot-time validation on both apps | M6-T1 (F16) |
| 9 | **Swallowed link/notify errors → store linked locally, main app unaware** | H | H | Installed merchant with a dead integration, no signal | `void fetch().catch(()=>undefined)` in link path | M2-T3 (F2) |
| 10 | **Multi-instance realtime silently breaks without Redis** | H | M | Operators miss messages the moment you scale to 2 pods | Redis pub/sub optional; in-memory fallback is per-process | M8-T1 |
| 11 | **No health checks / no error tracking → blind operations** | H | H | Incidents are multi-hour, not 10-minute | No `/api/health`, no Sentry/OTel, console-only logs | M6-T3/T5 |
| 12 | **Uncached live Shopify pulls exhaust rate limits** | H | M | Inbox opens fail; AI degrades to "not identified" | `cache:"no-store"` per open + per AI reply | M3-T2 / M8-T3 |
| 13 | **Order/customer context divergence (stored vs live)** | H | M | AI and operator state contradictory order facts | Two unreconciled context paths | M3-T2/T4 |
| 14 | **Connection-pool exhaustion at multi-instance scale** | H | M | Request queuing/timeouts under load | Fixed `max:10`, uncoordinated across instances | M8-T2 |
| 15 | **Non-transactional enrichment + webhook retries → partial/dupe state** | M | M | Half-applied order context, duplicate notes | No `db.transaction` around multi-key enrichment | M3-T2 |
| 16 | **Chat AI call blocks the visitor HTTP request** | M | H | Visible widget latency; hung Shopify leg can stall it | `await` inside `POST /messages`; no timeout on Shopify leg | M4 (A5/A16) |
| 17 | **Template fallback masks provider outages** | M | M | Silent AI quality collapse, no alert | Every catch → static template, no distinct signal | M6-T3 |
| 18 | **Silent 500-customer sync cap on large merchants** | M | M | Your best customers get incomplete coverage, no warning | `MAX_CUSTOMERS=500`, no partial-sync signal | M3-T3 |
| 19 | **Reinstall destroys prior workspace association** | M | M | Painful re-onboarding, perceived data loss | Uninstall deletes `ShopLink`; no retention | M2-T6 (F11) |
| 20 | **No per-workspace AI usage metering + shared OpenAI key** | M | M | Noisy-neighbor cost/rate blowups; can't meter for billing | Single global key, audit not persisted | M5-T4 |

---

## Final Questions

### 1. Would you launch Bybelt today?
**NO.**

### 2. Minimum blockers before accepting real merchants

**Absolute blockers (paid launch cannot proceed without these):**
1. **Real billing** — replace the mock card/subscription flow with a real provider, plus plan-gating enforcement (Risk #2 / M5-T2, M5-T3).
2. **Structural tenant isolation + an automated cross-tenant leak test** — the one failure that is existential (Risk #1 / M1-T4, M1-T5).
3. **Fail-closed production config** — refuse to boot in prod without `DATABASE_URL`; validate `BYBELT_INTERNAL_SECRET`/`SESSION_SECRET`/`OPENAI_*` at startup (Risks #4, #8 / M6-T1, M6-T2).
4. **Provable GDPR data erasure end-to-end** + non-500 install/error UX — required for App Store acceptance (Risk #3 / M2-T4).
5. **Schema-drift CI guard** so a missed dual-schema edit can't ship (Risk #5 / M1-T2/T3).
6. **Baseline observability** — a health endpoint, error tracking, and alerting on the install→webhook→AI-reply loop (Risk #11 / M6-T3, M6-T5).

**AI-safety blockers before AI is customer-facing on chat:**
7. **Sanitize customer-controlled fields** out of the system prompt (Risk #6 / A4).
8. **Gate chat AI** through the decision engine (confidence + escalation), or restrict chat AI to human-approved drafts until it is gated (Risk #7 / M4-T3/T4).

**Reliability blockers before the bridge is trusted:**
9. **Retry/outbox for link + redact bridge calls** so they cannot silently fail (Risk #9 / M2-T3).

If a *closed pilot with a handful of hand-held design-partner merchants on a single instance* is the goal (not "accepting real paying merchants"), items 1 and 10/14 (scale) can wait — but 2 (isolation), 3 (fail-closed config), 4 (GDPR), 7 (prompt injection), and 8 (chat gating) still cannot.

### 3. What I'd personally work on in the next 30 days as Lead Engineer

**Week 1 — Stop the existential bleeders.**
- Structural tenant-scoping helper + automated cross-tenant leak test (M1-T4/T5). Nothing else matters if this leaks.
- Central validated config module, fail-closed on missing `DATABASE_URL`/secrets in prod (M6-T1/T2). Kills Risks #4 and #8 together.
- Schema-drift CI check (M1-T2/T3).

**Week 2 — Make it observable and make the AI safe.**
- `/api/health` + `HEALTHCHECK` + error tracking (Sentry/OTel) + alerting on the core loop (M6-T3/T5). You cannot run merchants blind.
- Sanitize customer fields in the AI system prompt (A4) and gate chat AI (or force human-approved drafts) (M4-T3/T4).

**Week 3 — Shopify trust + GDPR for App submission.**
- Retry/outbox for bridge link + redact calls (M2-T3); prove end-to-end data erasure for `customers/redact` and `shop/redact`; add "restart install" error UX (M2-T4, F6/F8).
- Reconcile the two callback URLs and the two webhook-topic lists (F7, F3).

**Week 4 — Revenue + the scale tripwire.**
- Stand up real billing with plan gating (M5-T2/T3) — the launch cannot monetize without it.
- Make Redis mandatory when >1 instance (fail loud) and cache the live Shopify pull (M8-T1, M3-T2/M8-T3) — removes the first two bottlenecks you'll hit past ~100 tenants.

Left deliberately for later: God-component refactors, the shared data-fetching hook, module-boundary cleanup, read-replica/sharding. All real, none launch-blocking.

---

FINAL ENGINEERING REVIEW COMPLETE
