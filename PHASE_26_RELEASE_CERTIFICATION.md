# Phase 26 — Production Validation, QA & Release Certification

**Role:** Senior QA Engineer / Release Manager
**Method:** Verification from actual implementation. Documentation was **not** trusted.
**Date:** 2026-07-03

---

## 1. Verification Results (ground truth — commands actually run)

| Gate | Command | Result |
|------|---------|--------|
| Type safety | `npm run typecheck` (`tsc --noEmit`) | ✅ **PASS** (0 errors) |
| Production build | `npm run build` (standalone output) | ✅ **PASS** |
| Lint | `npm run lint` (`eslint`) | ❌ **FAIL** — 7 errors, 46 warnings |
| Secret hygiene | `npm run check:secrets` | ✅ **PASS** |
| Mock-runtime guard | `npm run check:no-mock` | ✅ **PASS** |
| Security tests | `npm run test:security` | ✅ **PASS** — 19/19 |
| Job framework | `npm run test:jobs` | ✅ **PASS** — 11/11 |
| Reliability framework | `npm run test:reliability` | ✅ **PASS** — 9/9 |

The only red gate is **lint**, which **CI runs as a hard step** (`.github/workflows/ci.yml`). A red lint means the CI pipeline blocks deploy even though the code is functionally sound.

---

## 2. Architecture Verification (verified in code, not docs)

| Area | Finding |
|------|---------|
| **Shopify webhook auth** | ✅ HMAC verified via official `authenticate.webhook()` in the separate `shopify-app` (Remix). GDPR webhooks (`customers/redact`, `customers/data_request`, `shop/redact`) verify HMAC, then bridge to the main app. Correct. |
| **Internal bridge** | ✅ `isValidInternalSecret` uses `secretsMatch` → SHA-256 digest + `crypto.timingSafeEqual`. Constant-time, fail-closed, audited on failed attempts. |
| **Workspace isolation** | ⚠️ One genuine IDOR found & fixed (see §3). All other data routes correctly scope via `authorizeWorkspace` / `requireSession`. |
| **Prompt-injection defense** | ✅ Sanitizer strips newlines, role delimiters, zero-width/bidi, code fences; bounds length. Unit-tested. |
| **Startup** | ✅ `instrumentation.register()` runs config validation (fail-fast in prod on missing `SESSION_SECRET`/`BYBELT_INTERNAL_SECRET`/`DATABASE_URL`), registers job-shutdown hooks + reliability defaults. Runs exactly once (guarded). Refuses SQLite fallback in production. |
| **Graceful shutdown** | ✅ SIGTERM/SIGINT → drain in-flight jobs within bounded window, then cooperative cancel via shared token + 2 s grace. Idempotent. |
| **Health endpoint** | ✅ `/api/health` checks DB + bridge + Redis + jobs. 503 only when DB down or prod config invalid; optional deps degrade (not fatal). |
| **Config validation** | ✅ Comprehensive; warns on multi-replica-without-Redis, malformed `REDIS_URL`, IMAP partial config, missing `OPENAI_API_KEY` (template fallback). |
| **Docker / Compose** | ✅ Standalone output (confirmed present), non-root `node` user, `STOPSIGNAL SIGTERM`, `HEALTHCHECK` on `/api/health`, `restart: unless-stopped`, `stop_grace_period: 30s` > drain window (25s+2s). Sound. |

---

## 3. Bugs Discovered & Fixed

### 🔴 BUG-1 (FIXED) — Unauthenticated cross-tenant read of AI reviews (IDOR) + broken Review Queue
- **File:** `src/app/api/ai/reviews/route.ts`
- **Severity:** High (security: broken access control / workspace-isolation bypass) **and** functional.
- **Discovery:** `GET /api/ai/reviews` read `workspaceId` directly from the query string with **no authentication and no ownership check**, then returned that workspace's pending AI reviews (customer message content + AI-drafted replies). Any anonymous caller could enumerate any tenant's review queue.
- **Compounding functional bug:** the actual client (`src/components/agent/ReviewQueue.tsx:36`) calls `fetch("/api/ai/reviews")` with **no** query param — so the endpoint returned `400 Missing workspaceId` on every real request. **The Review Queue never loaded.**
- **Every sibling route was already correct** (`[id]`, `approve`, `edit`, `publish`, `reject`, `reopen`, `timeline` all use `requireSession()` and scope by `session.workspace.id`). The list route was the lone outlier.
- **Fix:** derive `workspaceId` from `requireSession()` (ignore any client-supplied value), returning `401` when unauthenticated — mirroring the sibling routes exactly. This simultaneously **closes the IDOR** and **makes the Review Queue load**.
- **Verification:** `npm run typecheck` passes; `getPendingReviews(db, workspaceId)` signature unchanged.

_This was in the "Review Queue" DO-NOT-TOUCH area, but the change adds the same auth guard the rest of the feature already uses — it is a security/logic fix, not an architectural refactor or cosmetic change, and is explicitly in scope per STEP 6 & STEP 8._

### IDOR scan (whole `/api/**` surface)
Swept all 148 routes for the "trust client `workspaceId` without a guard" pattern. After BUG-1, the only remaining unguarded `workspaceId` routes are the **intentionally public** widget/help-center endpoints (`chatbox/config`, `chatbox/presence`, `chatbox/sessions`, `helpdesk/public/*`) — these expose only public-by-design data (widget config, public help articles) and create visitor-scoped sessions. **No further isolation gaps.**

---

## 4. Issues Discovered — NOT Fixed (with rationale)

### 🟠 BLOCKER-1 (pre-existing) — Lint fails CI (7 errors)
CI (`.github/workflows/ci.yml`) runs `npm run lint` as a hard gate, so this **blocks the deploy pipeline**. Errors:

| File | Error |
|------|-------|
| `scripts/db-seed.ts:50` | `prefer-const` |
| `scripts/db-seed.ts:95` | `no-explicit-any` |
| `src/components/agent/AiTimeline.tsx:48` | setState-in-effect |
| `src/components/agent/ReviewDetailPanel.tsx:21` | `no-explicit-any` |
| `src/components/agent/ReviewQueue.tsx:54, :87` | setState-in-effect + `no-explicit-any` |
| `src/components/analytics/AiAnalyticsPanel.tsx:40` | `no-explicit-any` |

**Not fixed because:** these are cosmetic/style violations (explicitly out of scope — "Do NOT perform cosmetic refactors") and 5 of 7 sit in DO-NOT-TOUCH areas (Analytics, Review Queue, agent). The underlying code is functionally correct — I inspected `AiTimeline.tsx`/`ReviewQueue.tsx`: the setState-in-effect flags are benign (proper `cancelled`-flag cleanup, no render loop, no race). **They are a CI-pipeline blocker, not a runtime bug.** Recommendation: authorize a one-shot mechanical lint pass (type the 4 `any`s, `const`, and add justified `eslint-disable` for the two intentional setState-on-mount resets), or relax those two rules to `warn`. Zero runtime risk either way.

### 🟡 HARDENING-1 (pre-existing, low) — `SESSION_SECRET` has no strength check
`validateConfig` only checks `SESSION_SECRET` is non-empty; a weak value (e.g. `"x"`) passes in production. Recommend a minimum-length assertion. Not a bug; deferred as a config behavior change that could reject existing deploys.

### 🟢 46 lint warnings
Mostly `<img>`-vs-`next/image` and unused vars. Cosmetic; no action.

---

## 5. Scorecard

| Dimension | Score | Basis |
|-----------|:-----:|-------|
| **Production Readiness** | **88 / 100** | All functional gates green; one high-sev bug found & fixed; one CI-pipeline blocker remains (mechanical). |
| Security | **90 / 100** | Constant-time secrets, HMAC webhooks, prompt-injection defense, fail-closed bridge. −10 for the found IDOR (now fixed) + no session-secret strength check. |
| Reliability | **93 / 100** | Retry/timeout/circuit-breaker/idempotency/dead-letter all tested green; graceful drain on shutdown. |
| Performance | **82 / 100** | Hot paths use scoped queries; not exhaustively load-tested this pass. No N+1 found in inspected paths. |
| Scalability | **80 / 100** | Redis fan-out optional; **single-replica-only without `REDIS_URL`** (correctly warned at boot, not enforced). |
| Maintainability | **85 / 100** | Strong typing (strict, 0 tsc errors), clear phase boundaries; −15 for red lint + `any` leaks. |

---

## 6. Remaining Risks / Launch Watch-list
1. **CI is red on lint** — pipeline will refuse to deploy until BLOCKER-1 is resolved (mechanical).
2. **Multi-replica without Redis** silently loses cross-instance SSE fan-out. Guardrail is a boot *warning*, not an enforced error — operationally risky if someone scales replicas. Keep to 1 replica unless `REDIS_URL` is set.
3. **Weak `SESSION_SECRET`** not rejected — operator discipline required.
4. Coverage caveat: representative critical paths were verified in depth (auth, isolation, webhooks, jobs, shutdown, health, deploy); not every one of 148 routes was line-audited.

---

## 7. Go / No-Go Recommendation

**Conditional GO.**

- The application is **functionally and architecturally production-ready**: type-safe, builds clean, all security/reliability/job test suites green, sound Docker/shutdown/health/config-fail-fast posture, and the one real security+functional bug (BUG-1) is fixed.
- **One gate must be cleared first:** the red lint that blocks CI (BLOCKER-1). This is a mechanical fix with zero runtime risk — resolve it (or downgrade the two style rules) and CI goes green.

→ **GO once BLOCKER-1 is cleared.** No architectural work required.

---

## 8. Rollback Plan
- **Code scope of this phase:** a single-file change — `src/app/api/ai/reviews/route.ts`.
- **Revert:** `git checkout -- src/app/api/ai/reviews/route.ts` (or revert the phase commit). No schema/migration/env changes were made, so rollback is instantaneous and stateless.
- **Deploy rollback:** `docker compose -f docker-compose.prod.yml` — redeploy the prior `bybelt-chat:<previous-tag>` image; `restart: unless-stopped` + healthcheck will cut over. No data migration to reverse.
- **Blast radius of the fix:** the Review Queue list endpoint only. If the fix regressed, symptom would be `401` in the Review Queue for logged-in operators — revert the one file.

---

## Files Modified
- `src/app/api/ai/reviews/route.ts` — enforce session-scoped workspace isolation (fixes IDOR + broken load).
- `PHASE_26_RELEASE_CERTIFICATION.md` — this report (new).

**PHASE 26 COMPLETE**
