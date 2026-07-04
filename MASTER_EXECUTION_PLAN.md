# Bybelt — Master Execution Plan

**Owner:** Chief Software Engineer
**Status:** Official roadmap (supersedes all prior phase logs — U1–U472, Phases A–T, Shopify Phases 1–125)
**Mission:** Become the best **AI-first Shopify Helpdesk** — not a Crisp clone, a better product.
**Date:** 2026-07-02

> This plan is grounded in three prior inputs: the **Technical Verification Report** (Phase 1 — backend is real: DB-backed auth, SSE, webhooks, workspace scoping), the **Architecture Review** (Phase 2 — no repository layer, dual hand-synced schemas, `max:10` pool, God components, optional-only Redis realtime), and the **Product Strategy** (AI-first Shopify positioning). It reframes the existing ~90%-built Crisp-clone codebase around a focused, launchable AI-Shopify product.

---

## 0. Strategic Framing — What Must Exist, What Waits

The existing codebase already implements a broad Crisp-equivalent surface. The strategic error to avoid is treating "feature parity with Crisp" as the launch bar. **The launch bar is: a Shopify merchant can install Bybelt, connect their store, and have AI meaningfully resolve customer conversations with order context — reliably and securely.** Everything else is scaffolding around that core loop.

### MUST EXIST BEFORE LAUNCH (V1.0)
The non-negotiable core loop plus the foundation that makes it safe to run for paying tenants.
- Shopify install → OAuth → store link → order/customer context in the inbox (the wedge)
- AI-assisted reply + AI auto-response gated by confidence, with order context injected
- Rock-solid multi-tenant isolation (structural, not convention)
- Auth, billing, and the operator inbox that already exist — hardened, not expanded
- Schema-drift fix and a data-access layer sufficient to not leak tenant data
- Observability + error handling good enough to run in production

### CAN WAIT UNTIL V2
Real but not launch-critical; the product sells and retains without them.
- Campaigns, help-center/knowledge-base authoring depth, analytics dashboards beyond core KPIs
- Marketing site polish beyond what's needed to convert
- Multi-language / LiveTranslate, advanced routing/triage rule builders
- Redis-mandatory horizontal scaling (needed at ~1,000 tenants, not at launch)

### ENTERPRISE (paid tier, post-V1)
- SSO/SAML, audit-log export, role granularity beyond owner/operator
- SLA management, dedicated IP email, data residency, contract/GDPR tooling depth
- Read-replica / sharded scaling, custom SMTP at scale

### AI (the durable moat — continuous track, not a one-time milestone)
- Confidence-gated auto-resolution, retrieval over store catalog + help articles
- AI drafting with order-aware grounding, escalation-to-human handoff
- Feedback loop: operator edits → training signal; quality measurement

---

## 1. Milestones (M1 → M8 = V1.0)

Sequencing principle: **fix the load-bearing foundation first (M1), then ship the wedge (M2–M4), then harden for money and scale (M5–M8).** AI runs as a track that lands its launchable slice in M4 and deepens through M7.

---

### Milestone M1 — Foundation Hardening (Schema + Data Access + Tenant Isolation)
- **Objective:** Eliminate the two Critical architecture risks that make every later feature unsafe: dual-schema drift and convention-only tenant isolation.
- **Deliverables:** Single-source-of-truth schema with CI drift check; a thin per-domain data-access layer that makes `workspaceId` scoping structurally required; automated cross-tenant-leak test.
- **Dependencies:** None (must be first).
- **Estimated Difficulty:** High
- **Risk:** High — touches 121 direct-DB call sites; regression surface is the whole app. Mitigate by wrapping, not rewriting, and migrating routes incrementally.
- **Expected Business Impact:** Prevents the single worst possible launch event (cross-tenant data leak) and unblocks safe scaling. No visible feature, maximum downside protection.

### Milestone M2 — Shopify Install & Store-Link Reliability
- **Objective:** Make "install the app, connect my store" a flawless, observable, resumable flow.
- **Deliverables:** Hardened OAuth + shop-link lifecycle; webhook ingestion with idempotency + retry + dead-letter; install/uninstall/redact compliance verified; store-link health surfaced to the merchant.
- **Dependencies:** M1 (webhook writes must go through the safe data layer).
- **Estimated Difficulty:** Medium-High
- **Risk:** Medium — Shopify App Store review requires GDPR webhooks (`customers/redact`, `shop/redact`, `data_request`) to be provably correct; a failure blocks listing.
- **Expected Business Impact:** This is the front door. If install is flaky, nothing else matters.

### Milestone M3 — Order-Context Inbox (The Wedge)
- **Objective:** Every conversation shows live, accurate Shopify order/customer context to the operator.
- **Deliverables:** Order/customer enrichment on conversation open; contact ↔ Shopify customer linkage; visitor-data keys (order status, spend, fulfilment) reliable and fresh; operator sees "who is this and what did they buy" instantly.
- **Dependencies:** M1, M2.
- **Estimated Difficulty:** Medium
- **Risk:** Medium — stale/incorrect order data erodes trust fast; freshness + accuracy are the bar.
- **Expected Business Impact:** This is the demo that sells. Order context in the inbox is the tangible "better than Crisp for Shopify" moment.

### Milestone M4 — AI Reply v1 (Confidence-Gated, Order-Grounded)
- **Objective:** AI drafts and (when confident) auto-sends replies grounded in the customer's order context and the store's help content.
- **Deliverables:** AI draft-reply in composer; confidence-gated auto-response with human-escalation fallback; grounding on order data + help articles; per-workspace enable/disable + guardrails; AI action logged and auditable.
- **Dependencies:** M3 (needs order context), M1 (safe data reads).
- **Estimated Difficulty:** High
- **Risk:** High — hallucinated order/refund statements are a brand-and-legal risk; gating and grounding are non-optional.
- **Expected Business Impact:** The core differentiator and the pricing justification. This is why Bybelt exists.

### Milestone M5 — Billing & Plan Enforcement (Real Revenue)
- **Objective:** Convert the existing mock billing into enforceable, real subscription revenue.
- **Deliverables:** Real payment provider integration (replacing the disclosed-mock card flow); plan gating that actually restricts features/usage; AI-usage metering; Shopify-billing-API alignment if listed via Shopify.
- **Dependencies:** M1; benefits from M4 (AI usage is the thing to meter).
- **Estimated Difficulty:** Medium-High
- **Risk:** Medium — billing bugs are trust-and-legal issues; must reconcile cleanly.
- **Expected Business Impact:** No revenue without this. Launch-blocking for a paid product.

### Milestone M6 — Production Readiness (Observability, Errors, Config)
- **Objective:** Make the system operable: fail loud, log usefully, configure safely.
- **Deliverables:** Central validated config module (fail-fast on missing env); structured logging + error tracking; consistent API error envelope; fail-closed DB config in production; runbook + alerting on the core loop (install, webhook, AI reply).
- **Dependencies:** M1 (config touches DB selection).
- **Estimated Difficulty:** Medium
- **Risk:** Low-Medium — mostly additive, but skipping it means blind production.
- **Expected Business Impact:** Determines whether incidents are 10-minute fixes or multi-hour outages. Directly protects retention.

### Milestone M7 — AI Quality & Feedback Loop
- **Objective:** Turn AI from "works in demo" into "measurably good and improving."
- **Deliverables:** Retrieval over full store catalog + help content; operator-edit-as-training-signal; AI quality dashboard (resolution rate, edit rate, escalation rate); tunable per-workspace tone/guardrails.
- **Dependencies:** M4 (needs AI v1 shipping + producing data).
- **Estimated Difficulty:** High
- **Risk:** Medium — quality plateau is the risk; needs real measurement to avoid shipping vibes.
- **Expected Business Impact:** Converts AI from a feature into a compounding moat and the retention driver.

### Milestone M8 — Realtime & Scale to First 1,000 Tenants
- **Objective:** Remove the horizontal-scale blockers before they become incidents.
- **Deliverables:** Redis pub/sub made mandatory for multi-instance realtime (fail loud without it); connection-pooling strategy (pooler/PgBouncer); read-cache on hot reads (conversation list, settings); load-tested to target concurrency.
- **Dependencies:** M1, M6.
- **Estimated Difficulty:** Medium-High
- **Risk:** Medium — under-provisioning silently breaks realtime across instances (Architecture Review #6).
- **Expected Business Impact:** Enables growth past the single-instance ceiling without a rewrite. Protects the growth curve.

**V1.0 = M1–M8 complete.**

---

## 2. Task Breakdown

Each task is scoped to **one focused development session**, independently completable. Complexity: **S** (≤½ session), **M** (one session), **L** (one intense session — split if it grows).

### M1 — Foundation Hardening

| ID | Title | Description | Acceptance Criteria | Deps | Complexity |
|----|-------|-------------|---------------------|------|-----------|
| M1-T1 | Schema single-source audit | Document every divergence between `schema.sqlite.ts` and `schema.pg.ts`. | Written diff table of all column/type mismatches; no code change. | — | M |
| M1-T2 | Schema drift CI check | Add a CI step that fails when the two schemas diverge structurally. | CI fails on an intentional test divergence; passes on current tree. | M1-T1 | M |
| M1-T3 | Correct `schema.ts` re-export bridge | Make the shared type surface dialect-correct (remove SQLite-only assumption). | `@/db/schema` types match the active dialect; typecheck passes both modes. | M1-T1 | M |
| M1-T4 | Tenant-scoped query helper | Introduce a helper that requires `workspaceId` as a first-class param for tenant tables. | Helper exists with tests; one pilot domain (contacts) migrated onto it. | M1-T3 | L |
| M1-T5 | Cross-tenant leak test harness | Automated test: workspace A cannot read/write workspace B data across core tables. | Test suite red against a deliberately-unscoped query, green against the helper. | M1-T4 | M |
| M1-T6 | Migrate inbox routes to data layer | Move conversation/message DB access behind the domain data-access module. | Inbox routes no longer call `getDb()` directly; leak test passes. | M1-T4 | L |
| M1-T7 | Migrate remaining tenant routes (tracked list) | Incrementally move remaining direct-`getDb()` routes behind data layer. | A tracked checklist reaches 100%; leak test covers each migrated table. | M1-T4 | L (split per domain) |
| M1-T8 | Dependency-graph CI check | Add `madge`/`dependency-cruiser` to catch cycles. | CI reports zero cycles or an explicit allowlist; runs on PR. | — | S |

### M2 — Shopify Install & Store-Link Reliability

| ID | Title | Description | Acceptance Criteria | Deps | Complexity |
|----|-------|-------------|---------------------|------|-----------|
| M2-T1 | OAuth flow resilience audit | Trace install→OAuth→link end-to-end; list every failure/abandon point. | Documented flow with failure modes; no code change. | M1 | M |
| M2-T2 | Webhook idempotency keys | Ensure duplicate Shopify webhook deliveries are safely deduped. | Replaying a webhook twice produces one effect; test proves it. | M1-T4 | M |
| M2-T3 | Webhook retry + dead-letter | Failed webhook processing is retried and, on exhaustion, captured. | Simulated failure lands in dead-letter store; alert fires. | M2-T2 | L |
| M2-T4 | GDPR webhook compliance verification | Prove `customers/redact`, `shop/redact`, `data_request` behave per Shopify spec. | Each redact/request produces verifiable data removal/notification; test suite. | M1-T4 | L |
| M2-T5 | Store-link health surface | Merchant-visible status of their Shopify connection + last sync. | Settings shows live link health; unhealthy state is actionable. | M2-T1 | M |
| M2-T6 | Uninstall lifecycle correctness | `app/uninstalled` fully unlinks and notifies without orphaned data. | Post-uninstall, no tenant data reachable; workspace webhook fired. | M2-T4 | M |

### M3 — Order-Context Inbox

| ID | Title | Description | Acceptance Criteria | Deps | Complexity |
|----|-------|-------------|---------------------|------|-----------|
| M3-T1 | Contact↔Shopify customer linkage integrity | Guarantee correct, deduped contact-to-customer mapping. | Same customer across email/phone resolves to one contact; test. | M1, M2 | M |
| M3-T2 | On-open order enrichment | When a conversation opens, fetch/refresh the customer's order context. | Operator sees current order status/spend within the open action; freshness bounded. | M3-T1 | L |
| M3-T3 | Visitor-data freshness policy | Define + enforce staleness/refresh for `shopify_*` visitor-data keys. | Documented TTL; stale data is refreshed or flagged; test. | M3-T2 | M |
| M3-T4 | Order-context UI panel hardening | Ensure the customer-info panel renders order context clearly and degrades gracefully. | Panel shows order state; empty/no-store states are clean; no layout break. | M3-T2 | M |
| M3-T5 | Enrichment error isolation | A Shopify fetch failure never blocks opening/replying to a conversation. | With Shopify API down, inbox still works; context shows "unavailable." | M3-T2 | M |

### M4 — AI Reply v1

| ID | Title | Description | Acceptance Criteria | Deps | Complexity |
|----|-------|-------------|---------------------|------|-----------|
| M4-T1 | AI reply grounding contract | Define exactly what context (order + help) is injected and what AI may/may not claim. | Written grounding + guardrail spec; reviewed. | M3 | M |
| M4-T2 | Draft-reply in composer | Operator can request an AI draft grounded in the conversation + order context. | Draft appears editable in composer; uses real order context; logged. | M4-T1 | L |
| M4-T3 | Confidence scoring + gate | Compute a confidence signal; only auto-send above threshold. | Below-threshold replies never auto-send; threshold is per-workspace configurable. | M4-T2 | L |
| M4-T4 | Auto-response + human escalation | When confident, auto-reply; otherwise escalate to an operator. | Confident case auto-replies; uncertain case creates operator task; test both. | M4-T3 | L |
| M4-T5 | AI action audit log | Every AI draft/send is recorded with inputs, confidence, and outcome. | Audit entry per AI action, queryable; visible to workspace. | M4-T2 | M |
| M4-T6 | Per-workspace AI kill switch | Merchant can enable/disable AI and auto-send independently, instantly. | Toggling disables AI within one request cycle; state persists per workspace. | M4-T3 | S |

### M5 — Billing & Plan Enforcement

| ID | Title | Description | Acceptance Criteria | Deps | Complexity |
|----|-------|-------------|---------------------|------|-----------|
| M5-T1 | Billing provider decision + spec | Choose provider (Shopify Billing API vs. Stripe) and document the model. | Written decision with plan/metering model; no code. | M1 | M |
| M5-T2 | Real card/subscription flow | Replace mock card flow with real provider subscription lifecycle. | A real subscription can be created/cancelled; reconciles with provider. | M5-T1 | L |
| M5-T3 | Plan gating enforcement | Feature/usage limits actually restrict access per plan. | Over-limit action is blocked with clear upgrade path; test per gate. | M5-T2 | L |
| M5-T4 | AI-usage metering | Meter AI actions for billing/limits. | AI usage counted accurately per workspace; visible; test. | M5-T2, M4-T5 | M |
| M5-T5 | Dunning + failed-payment handling | Handle payment failure without data loss or abrupt lockout. | Failed payment triggers grace flow, not silent breakage; test. | M5-T2 | M |

### M6 — Production Readiness

| ID | Title | Description | Acceptance Criteria | Deps | Complexity |
|----|-------|-------------|---------------------|------|-----------|
| M6-T1 | Central validated config module | Single module validates all required env at boot; fail-fast. | Missing required var aborts startup with a clear message; test. | M1 | M |
| M6-T2 | Fail-closed production DB config | Production without `DATABASE_URL` refuses to start (no SQLite fallback). | Prod boot without DB URL fails loudly; dev fallback unchanged. | M6-T1 | S |
| M6-T3 | Structured logging + error tracking | Introduce request-scoped structured logs + error reporter. | Errors reach the tracker with context; core loop is traced. | — | M |
| M6-T4 | Consistent API error envelope | Standardize error shape/status across routes. | Documented envelope; core routes conform; contract test. | M1-T7 | M |
| M6-T5 | Core-loop alerting + runbook | Alerts on install/webhook/AI-reply failure with a written runbook. | Synthetic failure pages on-call; runbook resolves it. | M6-T3 | M |

### M7 — AI Quality & Feedback Loop

| ID | Title | Description | Acceptance Criteria | Deps | Complexity |
|----|-------|-------------|---------------------|------|-----------|
| M7-T1 | Retrieval over store catalog + help | Ground AI on the full product catalog and help articles, not just the order. | AI answers reference correct catalog/help facts; retrieval tested. | M4 | L |
| M7-T2 | Operator-edit training signal | Capture operator edits to AI drafts as a quality/feedback signal. | Edits are recorded and attributable; feed a quality store. | M4-T2 | M |
| M7-T3 | AI quality dashboard | Surface resolution rate, edit rate, escalation rate per workspace. | Dashboard shows the three core AI metrics; data verified. | M7-T2 | M |
| M7-T4 | Per-workspace tone/guardrail tuning | Let merchants set tone and hard guardrails safely. | Tone/guardrail settings applied to AI output; guardrails cannot be bypassed. | M4-T1 | M |

### M8 — Realtime & Scale

| ID | Title | Description | Acceptance Criteria | Deps | Complexity |
|----|-------|-------------|---------------------|------|-----------|
| M8-T1 | Mandatory Redis fan-out (multi-instance) | Require Redis when >1 instance; fail loud without it. | Two instances deliver cross-instance realtime; missing Redis fails clearly. | M1, M6-T1 | M |
| M8-T2 | Connection-pooling strategy | Introduce a pooler / bounded per-instance pool budget. | Pool config is instance-aware; load test shows no exhaustion at target. | M1 | L |
| M8-T3 | Read-cache on hot reads | Cache conversation-list and settings reads. | Cache hit reduces DB query rate measurably; invalidation correct; test. | M8-T2 | L |
| M8-T4 | Load test to first-1,000-tenant target | Validate the system at target concurrency. | Documented load-test run meeting latency/error targets. | M8-T1, M8-T2, M8-T3 | M |

---

## 3. Blockers

### Critical Blockers (nothing launches until resolved)
- **M1-T4/T5 — Tenant isolation must be structural.** Convention-only `workspaceId` scoping across 121 direct-DB routes is a data-leak waiting to happen (Architecture Review #1, #9).
- **M1-T2/T3 — Schema drift.** Dual hand-synced schemas bridged by an `as unknown as` cast fail at runtime, not compile time (Architecture Review #2).

### Security Blockers
- Cross-tenant data isolation (M1-T5) — verified by automated test, not review.
- M2-T4 GDPR webhook compliance — required for Shopify listing and legally non-optional.
- M6-T1/T2 — no unvalidated/fail-open production config (a wrong `DATABASE_URL` must not silently degrade).
- M4 AI guardrails — AI must not assert false order/refund facts (brand + legal risk).

### Launch Blockers
- M2 (install reliability) — the front door must not be flaky.
- M3 (order context) — the wedge; without it there is no "better than Crisp for Shopify."
- M4 (AI reply v1) — the reason the product exists.
- M5 (real billing) — no revenue without it.
- M6 (observability) — cannot responsibly run paid tenants blind.

### Scalability Blockers (block growth past ~1,000 tenants, not launch)
- Optional-only Redis realtime (M8-T1) — silently breaks on horizontal scale (Architecture Review #6).
- Fixed `max:10` uncoordinated pool (M8-T2) — hard concurrency ceiling (Architecture Review #3).
- No caching tier (M8-T3) — every SSE tick re-queries the DB (Architecture Review #13).

---

## 4. Intentionally Postponed (Explicit Non-Goals for V1.0)

These are deliberately deferred — building them now would dilute the wedge:
- **Campaigns depth, template CRUD, campaign analytics** (U106–U261 era work) — keep functional, do not expand.
- **Help-center/knowledge-base authoring depth** beyond what AI retrieval (M7-T1) needs.
- **Analytics beyond core KPIs** — the 30+ analytics sub-routes are V2/Enterprise, not launch.
- **Multi-language / LiveTranslate, advanced routing/triage rule builders.**
- **God-component refactors** (`SettingsDetail.tsx` 4,217 LOC, `AnalyticsPanel.tsx`, `useConversations.ts`) — real debt (Architecture Review #4, #15, #16) but not launch-blocking; schedule as V2 maintenance unless they obstruct a launch task.
- **Shared data-fetching primitive across ~50 hooks** (Architecture Review #5) — high-value cleanup, but a maintainability win, not a launch gate. Do it in V2 when it can be done wholesale.
- **Enterprise tier** (SSO/SAML, audit export, SLA, data residency, sharding) — post-V1 by definition.
- **Marketing site expansion** beyond conversion essentials.
- **Legacy dead code** (`src/lib/mock-*.ts`) — delete opportunistically, not a milestone.

---

## 5. Execution Order (one-line summary)

**M1 (make it safe) → M2 (front door) → M3 (the wedge) → M4 (the reason) → M5 (the money) → M6 (keep it alive) → M7 (make AI compound) → M8 (let it grow).**

AI is a continuous track landing its launchable slice at M4 and deepening through M7. Foundation (M1) and production readiness (M6) are the unglamorous work that determines whether the product survives contact with real merchants — they are not optional and not deferrable.

PHASE 4 COMPLETE
