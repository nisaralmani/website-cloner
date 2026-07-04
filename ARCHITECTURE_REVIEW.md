# Architecture Review — Bybelt (website-cloner)

**Reviewer role:** Principal Software Architect (read-only audit)
**Date:** 2026-07-02
**Scope:** Full repository — folder structure, dependency graph, business/repository/DB/API layers, frontend/React architecture, hooks, utilities, state management, configuration, environment variables, shared libraries.
**Method:** Direct file inspection and repo-wide static grep/wc sampling (no build/runtime instrumentation, no `madge`/`dependency-cruiser` run — noted where this limits confidence). No files were modified.

---

## 1. Repository Shape (facts)

| Area | Size |
|---|---|
| `src/app` (routes) | 174 files, incl. **139 `route.ts` API handlers** |
| `src/components` | 129 files |
| `src/hooks` | 51 files |
| `src/lib` | 221 files (mixed flat + nested domain folders) |
| `src/db` | 5 files — `schema.ts`, `schema.sqlite.ts` (581 LOC), `schema.pg.ts` (589 LOC), `client.ts`, `dialect.ts` |
| `src/types` | 25 files |

Largest files (top offenders):

| File | LOC |
|---|---|
| `src/components/settings/SettingsDetail.tsx` | 4,217 |
| `src/lib/settings-registry.ts` | 1,837 |
| `src/components/analytics/AnalyticsPanel.tsx` | 1,330 |
| `src/lib/marketing-pricing-compare.ts` | 1,111 |
| `src/components/chatbox/VisitorChatWidget.tsx` | 1,087 |
| `src/hooks/useConversations.ts` | 1,066 |
| `src/components/inbox/ConversationDetail.tsx` | 881 |
| `src/db/schema.pg.ts` / `schema.sqlite.ts` | 589 / 581 |

No `src/repositories`, `src/services`, or equivalent named layer exists anywhere in the tree. Data access lives inside `src/lib/<domain>/*.ts` and, in the majority of cases, directly inside route handlers.

---

## 2. Layer-by-Layer Findings

### 2.1 API layer (`src/app/api/**/route.ts`)
- 139 route handlers. **121 of 139 (87%) call `getDb()` directly inside the route file** — Drizzle queries, business rules, and HTTP concerns (auth, validation, status codes) are interleaved in a single function. Evidence: `src/app/api/auth/login/route.ts`, `src/app/api/billing/cards/route.ts` both build queries and issue responses in the same file with no repository indirection.
- Where a `src/lib/*` module *is* used (e.g. `deliverWebhookTest`, `createContact`), it is inconsistent whether that module owns DB access or merely wraps validation — the boundary between "business layer" and "repository layer" is not enforced anywhere; it's a convention some files follow and most don't.
- Authorization pattern (workspace scoping via `eq(table.workspaceId, session.workspace.id)`) is real and consistent where sampled (`contacts/route.ts`), but because each route hand-writes its own scoping clause instead of going through a shared repository, a single route that forgets the `.where(eq(...workspaceId...))` clause is a silent cross-tenant data leak with no structural guard against it.

### 2.2 Database layer
- **Two hand-maintained, structurally-parallel schema files** (`schema.sqlite.ts`, `schema.pg.ts`, ~580 LOC each) must be kept in sync by hand for every migration. `src/db/schema.ts` is a bare re-export of the **SQLite** variant only (`export * from "./schema.sqlite"`), meaning every file in the codebase that imports types from `@/db/schema` is type-checked against the SQLite shape even in Postgres production mode.
- `src/db/client.ts` bridges this with an explicit unsafe cast: `drizzlePostgres(...) as unknown as SqliteDb`. This is a **leaky abstraction by design** — the type system cannot catch a Postgres/SQLite schema divergence; it will only surface as a runtime SQL error in production.
- Single global connection: `postgres(getPostgresUrl(), { max: 10 })`, one client per process, memoized in a module-level variable. No pooler abstraction, no read-replica concept, no per-tenant routing.

### 2.3 Business / "repository" layer
- No consistent repository pattern. `src/lib` mixes: pure formatting helpers (`billing/payment-methods.ts`), business services with DB access (`workspaces/webhook-delivery.ts`), and route-adjacent config modules (`analytics-routes.ts`, `campaigns-routes.ts`, `helpdesk-routes.ts`) that appear to duplicate the organizational role of the `src/lib/<domain>/` folders sitting next to them.
- Concrete duplication-of-concern example: campaigns logic is split across `src/lib/campaigns/` (folder) **and** `src/lib/campaigns-routes.ts` (flat file); same pattern for `helpdesk/` + `helpdesk-routes.ts`, and settings is split four ways: `src/lib/settings/`, `settings-data.ts`, `settings-help-urls.ts`, `settings-registry.ts`. There is no documented rule for which concern belongs in which location — this is organic growth, not a designed module boundary.
- Shopify integration logic is scattered across **6 files in `src/lib/integrations/`**, plus `src/lib/contacts/shopify-sync.ts`, plus `src/lib/inbox/shopify-conversation.ts`, plus 3 dedicated hooks (`useShopifyContactSync`, `useShopifySyncStatus`, `useShopifyCustomerContext`) — a single external integration with no single owning module.

### 2.4 Frontend / React architecture
- `SettingsDetail.tsx` (4,217 LOC) is a single component apparently rendering all 31 settings sub-pages, driven by `settings-registry.ts` (1,837 LOC) as a giant declarative config object. This is a textbook God Component: one file's blast radius covers the entire settings surface of the app; a change to one settings page risks affecting unrelated ones, and the file is effectively unreviewable in a single pass.
- `AnalyticsPanel.tsx` (1,330 LOC) and `VisitorChatWidget.tsx` (1,087 LOC) follow the same pattern at smaller scale.
- No `src/lib -> src/components` import was found in a repo-wide grep — the one layering rule that *is* respected is "lib doesn't import UI." That is a genuine positive.

### 2.5 Hooks / state management
- **Verified duplicate pattern across ~51 hooks**: `useContacts.ts` and `useVisitors.ts` (and by naming/shape inspection, the rest of the `use*` hooks in `src/hooks/`) each hand-roll an identical `useState(loading/error/data) + useCallback(reload) + fetch + try/catch/finally` block from scratch. There is **no shared data-fetching primitive** anywhere in the codebase (`grep` found zero `useFetch`/`useApi`/`useQuery` helpers), and no data-fetching library is installed (no `swr`, no `@tanstack/react-query` in `package.json`). This is the single largest concrete duplication finding in the review — the same ~25-line boilerplate is estimated to be copy-pasted 40–50 times.
- No global state manager (Redux/Zustand/Jotai) — state is per-hook-per-component plus five React Context providers (`AppProviders`, `SessionProvider`, `InboxCustomizeProvider`, `InterfacePreferencesApplier`, `ShortcutPreferencesProvider`). For an app this size, that's a reasonable minimalist choice, but it means every one of the 51 hooks independently owns its cache/staleness/error semantics with no consistency guarantee between them (e.g. two hooks polling the same resource can disagree on freshness).
- Realtime data model is polling-based even where SSE exists: `src/app/api/inbox/stream/route.ts` polls the DB every `INBOX_LIST_POLL_MS` / `INBOX_THREAD_POLL_MS` *inside* the SSE handler and layers an in-process/Redis pub/sub push on top. Every open browser tab holds one long-lived DB-polling loop server-side.

### 2.6 Configuration / environment variables
- 22 direct `process.env.X` call sites scattered across the tree with **no central, validated config module** (no `env.ts` with schema validation, e.g. zod-parsed env). `.env.example` lists 25+ variables (DB, session secret, OAuth, SMTP/IMAP, OpenAI, Shopify, internal secrets) with no code-level guarantee that a missing required var is caught at boot rather than deep inside a request handler.
- `src/db/dialect.ts` silently falls back to a default SQLite file path (`data/bybelt.db`) if `DATABASE_URL`/`DATABASE_PATH` are both unset — reasonable for local dev, but it means a misconfigured production deploy fails *open* into local-file mode rather than failing loudly.

### 2.7 Naming & organization inconsistencies
- Hook naming is inconsistent: `useChatboxAppearanceFields`, `useChatboxBehaviorFields`, `useEmailDeliveryFields`, `useEmailDomainFields` use a `*Fields` suffix, while structurally identical settings-backed hooks elsewhere (`useSettingsToggles`, `useWorkspaceAdvanced`) don't — no evident naming convention document or enforcement (no custom ESLint rule for hook naming).
- `middleware.ts` (246 LOC) is a single file handling routing/auth/subdomain concerns for the whole app + marketing site — a cross-cutting-concern God File at smaller scale than `SettingsDetail.tsx` but the same shape of problem.

### 2.8 Circular dependencies
- Not confirmed either way with certainty — no dependency-graph tool (`madge`, `dependency-cruiser`) is installed or was run. The one layering rule checked directly (`lib` must not import `components`) holds. Given the `lib/<domain>/` ↔ `<domain>-routes.ts` ↔ `hooks/use<Domain>.ts` triangular structure repeated per domain, cycles are architecturally *plausible* within a domain (e.g. `lib/inbox/*` ↔ `lib/inbox/shopify-conversation.ts` ↔ `lib/integrations/shopify-*`) but this review did not find a concrete instance. **Recommend running a dependency-graph tool before treating this as resolved.**

---

## 3. Can This Scale to 10 / 100 / 1,000 / 10,000 Stores?

The domain model here is **one workspace ≈ one connected Shopify store** (confirmed via `src/lib/integrations/shopify-*`, `useShopifyContactSync`, `useShopifySyncStatus`). So "stores" is read as "tenants/workspaces" below.

### 10 stores — ✅ Fine as-is
Single SQLite/Postgres instance, 10-connection pool, polling SSE per open tab. Total concurrent load (a handful of operators, occasional visitor traffic) is nowhere near any of the ceilings identified above. No changes needed.

### 100 stores — ⚠️ Workable, early warning signs
- The fixed `max: 10` Postgres pool starts to matter once concurrent SSE connections (each polling every `INBOX_LIST_POLL_MS`/`INBOX_THREAD_POLL_MS`) plus normal CRUD traffic overlap — 10 connections serving potentially hundreds of concurrent operator tabs is thin, though request duration is short enough this likely still holds up.
- The lack of a repository/query layer becomes a maintainability problem before it becomes a performance problem: every new feature adds another hand-written `getDb()` call site with its own scoping logic to audit for tenant-isolation correctness.

### 1,000 stores — ❌ Real bottlenecks appear
- **Connection pool ceiling**: `max: 10` on a single process is a hard limit; running multiple app instances behind a load balancer (required at this scale) each opens *its own* pool, so the true limit becomes `instances × 10` with no coordination — this needs a pooler (e.g. PgBouncer) or a deliberate per-instance pool budget, neither of which exists today.
- **SSE fan-out**: Redis pub/sub is explicitly "optional" (`REDIS_URL` optional, in-memory fallback). Running more than one app instance without Redis means operators connected to instance A never see events published by instance B — this silently breaks realtime updates the moment horizontal scaling is introduced, unless Redis is made mandatory.
- **No caching layer**: every SSE tick re-queries the DB for the conversation list snapshot and diffs it in application code (`JSON.stringify` comparison in `inbox/stream/route.ts`). At 1,000 tenants × N operators × poll interval, this is a steadily growing constant-query-rate floor with no cache to absorb it.
- **Schema drift risk compounds**: with more tenants, downtime from a missed `schema.pg.ts`/`schema.sqlite.ts` sync becomes a production incident rather than a dev inconvenience.

### 10,000 stores — ❌ Architecture does not support this without structural rework
- Single Postgres primary, no read replicas, no sharding, no tenant-aware routing anywhere in the code — this is a single point of both failure and throughput ceiling.
- The absence of a repository layer means there is no single place to introduce caching, query batching, rate limiting, or read/write splitting later — each of the 121 direct-`getDb()` call sites would need to be touched individually.
- Polling-based realtime (even with Redis) doesn't scale gracefully to tens of thousands of concurrently open operator/visitor connections on one SSE-per-tab, server-held-loop model — this is the kind of load a dedicated realtime infra (e.g. a managed pub/sub or WebSocket gateway) is built for, not ad hoc `setInterval` polling inside a Next.js route handler.
- Config/env handling (unvalidated, scattered `process.env` reads) becomes an operational risk at multi-region/multi-instance scale, where a misconfigured instance silently degrades instead of failing to boot.

**Bottom line:** this is a solid, honestly-built single-tenant-shaped app that happens to support multiple tenants via a `workspaceId` column — not a system designed for horizontal, many-instance, many-region scale. 10–100 stores: fine. 1,000+: needs the data-access, caching, and realtime layers rebuilt, not tuned.

---

## 4. Top 20 Architectural Problems (ranked by severity)

### 1. No repository/data-access layer — 121/139 routes query the DB directly
- **Severity:** Critical
- **Impact:** Every route independently owns tenant-scoping correctness, query shape, and error handling; no single place to add caching, auditing, or rate limiting.
- **Risk:** A single forgotten `workspaceId` filter is a silent cross-tenant data leak; already-diffuse now, gets worse with every new route.
- **Suggested direction:** Introduce a thin repository/query module per domain that all routes call through; make tenant scoping structurally required (e.g. a helper that always takes `workspaceId` as its first argument) rather than convention-based.

### 2. Dual hand-synced DB schemas with an unsafe type cast bridging them
- **Severity:** Critical
- **Impact:** `schema.sqlite.ts` and `schema.pg.ts` can silently diverge; the only re-exported type surface (`schema.ts`) reflects SQLite even in Postgres production.
- **Risk:** A migration applied to one dialect and not the other fails at runtime, not compile time, potentially in production.
- **Suggested direction:** Single source-of-truth schema definition with dialect-specific column-type mapping, or a codegen step that derives one file from the other with a CI check that fails on drift.

### 3. Fixed, unmanaged Postgres connection pool (`max: 10`) with no pooling strategy for multi-instance deployment
- **Severity:** Critical (at scale)
- **Impact:** Hard ceiling on concurrent DB work per process; uncoordinated across horizontally-scaled instances.
- **Risk:** Silent connection exhaustion / request queuing under load once beyond single-instance deployment.
- **Suggested direction:** Introduce a connection pooler (e.g. PgBouncer) or managed Postgres proxy before horizontal scaling; make pool size configurable and instance-aware.

### 4. God component: `SettingsDetail.tsx` (4,217 LOC) + `settings-registry.ts` (1,837 LOC)
- **Severity:** High
- **Impact:** Single file governs all 31 settings pages; unreviewable in one pass, high change-collision risk.
- **Risk:** Any settings feature work touches a shared blast-radius file; regression risk across unrelated settings pages.
- **Suggested direction:** Split by settings domain (one component/module per settings section) driven by a registry that composes rather than one monolithic file.

### 5. No shared data-fetching hook — ~50 hooks duplicate identical loading/error/fetch boilerplate
- **Severity:** High
- **Impact:** Verified duplication (`useContacts.ts`, `useVisitors.ts`) of the same ~25-line pattern repeated across the hook layer; no shared caching/staleness semantics.
- **Risk:** Bug fixes (e.g. race conditions, abort handling) must be applied ~50 times; inconsistent behavior between hooks that should behave identically.
- **Suggested direction:** Adopt or build one shared fetch/cache primitive (e.g. SWR/react-query, or a small internal `useResource` hook) and migrate hooks onto it incrementally.

### 6. Realtime model is polling-under-SSE with optional-only Redis fan-out
- **Severity:** High
- **Impact:** Every open tab holds a server-side polling loop; multi-instance deployments silently lose cross-instance realtime delivery without Redis.
- **Risk:** Realtime breaks invisibly the moment the app is scaled to >1 instance unless `REDIS_URL` is remembered and set.
- **Suggested direction:** Make the pub/sub transport mandatory (fail loudly without it) once more than one instance is intended, and evaluate a push-native transport for scale beyond SSE-per-tab polling.

### 7. Scattered, unvalidated environment variable access (22 raw `process.env` sites, no central config)
- **Severity:** High
- **Impact:** Misconfiguration surfaces deep inside request handlers instead of at boot.
- **Risk:** Production misconfiguration (e.g. missing `SESSION_SECRET`, wrong `DATABASE_URL`) fails silently or late.
- **Suggested direction:** Centralize env access behind one validated config module (fail fast at process start on missing required vars).

### 8. Inconsistent domain module boundaries (`lib/<domain>/` + `<domain>-routes.ts` + flat files coexisting)
- **Severity:** Medium-High
- **Impact:** No discoverable rule for where a given piece of domain logic lives (campaigns, helpdesk, settings all split 2–4 ways).
- **Risk:** New contributors duplicate logic because the existing home for it isn't obvious; already visible in the settings split.
- **Suggested direction:** Pick one convention (folder-per-domain with `index.ts`) and consolidate; document it once and enforce via review.

### 9. No repository-level tenant isolation guarantee (isolation is convention, not structure)
- **Severity:** Medium-High
- **Impact:** Sampled routes correctly scope by `workspaceId`, but nothing prevents a new route from omitting it.
- **Risk:** Cross-tenant data exposure is one missed `.where()` clause away, and there's no automated check for it.
- **Suggested direction:** Wrap tenant-scoped queries in a helper that requires `workspaceId` as a parameter, or add a lint/test rule that flags direct `db.select().from(<tenantTable>)` without a workspace filter.

### 10. Shopify integration logic has no single owning module (spread across 10+ files in 4 different directories)
- **Severity:** Medium
- **Impact:** Hard to reason about the full surface of one external integration; onboarding/debugging cost.
- **Risk:** Duplicate or inconsistent handling of the same Shopify data across `lib/integrations`, `lib/contacts`, `lib/inbox`, and hooks.
- **Suggested direction:** Consolidate under a single `lib/shopify/` (or `integrations/shopify/`) module with a clear public surface.

### 11. No dependency-graph tooling in the repo (circular-dependency risk unmeasured)
- **Severity:** Medium
- **Impact:** Cannot currently rule out cycles within the `lib/<domain>` ↔ `hooks` ↔ `<domain>-routes.ts` triangles.
- **Risk:** Undetected cycles cause subtle build/HMR issues and make refactors riskier than they appear.
- **Suggested direction:** Add `madge`/`dependency-cruiser` to CI as a read-only check.

### 12. `middleware.ts` (246 LOC) as a single cross-cutting file for auth + subdomain routing
- **Severity:** Medium
- **Impact:** One file governs request routing for both the app and marketing multi-domain setup.
- **Risk:** Same God-File shape as #4, at smaller scale — a routing bug here affects every request.
- **Suggested direction:** Split by concern (auth guard vs. domain/subdomain rewriting) into composed, independently testable functions.

### 13. No caching layer between API routes and the database
- **Severity:** Medium
- **Impact:** Every read (including polled SSE snapshots) is a live query; no absorption of repeated reads.
- **Risk:** Read load scales linearly (or worse) with tenants × operators × poll frequency with nothing to flatten it.
- **Suggested direction:** Introduce a read-cache (Redis, already a dependency) in front of hot, low-churn reads (conversation lists, settings toggles).

### 14. Inconsistent hook naming conventions (`*Fields` vs `*Settings` vs bare domain name)
- **Severity:** Low-Medium
- **Impact:** Increases cognitive load when navigating 51 hooks; no enforced convention.
- **Risk:** Low direct risk, compounds general maintainability debt.
- **Suggested direction:** Adopt and lint-enforce one naming scheme (e.g. always `use<Domain>[<SubResource>]`).

### 15. Large single-purpose files beyond settings (`AnalyticsPanel.tsx` 1,330 LOC, `VisitorChatWidget.tsx` 1,087 LOC, `useConversations.ts` 1,066 LOC)
- **Severity:** Low-Medium
- **Impact:** Same God-File pattern at smaller scale across the inbox/analytics/chatbox surfaces.
- **Risk:** Review and change-collision cost scales with these files' size.
- **Suggested direction:** Decompose along the same lines as #4 once that pattern is validated.

### 16. `useConversations.ts` (1,066 LOC) mixing fetch, polling, mutation, and derived-state logic in one hook
- **Severity:** Low-Medium
- **Impact:** The single largest hook in the codebase; likely the highest-traffic one (inbox is the core feature).
- **Risk:** Hard to test in isolation; changes to one concern (e.g. polling cadence) risk affecting unrelated logic (e.g. optimistic sends).
- **Suggested direction:** Split into composable hooks (fetch, realtime-subscribe, mutations) once the shared-fetch primitive (#5) exists.

### 17. Fail-open database configuration (silently defaults to local SQLite file if env vars are unset)
- **Severity:** Low-Medium
- **Impact:** A misconfigured production deploy degrades to local-file mode instead of refusing to start.
- **Risk:** Silent data-loss/isolation risk if a production instance ever runs without `DATABASE_URL` set.
- **Suggested direction:** Require explicit dialect selection in production (`NODE_ENV=production` should fail fast without `DATABASE_URL`), keep the silent fallback for local dev only.

### 18. No formal API response envelope/consistency check across 139 routes (unverified at full scope)
- **Severity:** Low
- **Impact:** Unknown consistency of error shapes, status codes, and pagination conventions across the full route surface — only sampled routes were checked and were consistent.
- **Risk:** Frontend hooks may each hand-roll slightly different error handling as a downstream effect of #5.
- **Suggested direction:** Audit all 139 routes for response-shape consistency (tooling-assisted) as a follow-up.

### 19. `src/lib` has grown to 221 files with mixed flat/nested organization and no index/barrel convention
- **Severity:** Low
- **Impact:** Navigation cost increases; no single discoverable entry point per domain.
- **Risk:** Compounds #8 — makes "where does this belong" harder to answer as the codebase grows toward larger feature/tenant surface.
- **Suggested direction:** Introduce `index.ts` per domain folder as the only cross-domain import surface; disallow deep imports via lint rule.

### 20. Legacy dead code left in tree (`src/lib/mock-*.ts`, unused but guarded by a CI script rather than removed)
- **Severity:** Low
- **Impact:** No functional risk (confirmed zero imports from `src/app`/`src/components`, enforced by `scripts/check-no-mock-runtime.mjs` in CI), but it's dead weight and a discoverability trap for new contributors.
- **Risk:** Low; mostly a hygiene/clarity issue.
- **Suggested direction:** Delete the mock modules now that the CI guard confirms they're unused, or document explicitly why they're intentionally retained.

---

## 5. Summary

The codebase is **functionally real** (verified in the prior audit phase: genuine DB-backed auth, SSE, webhooks, workspace scoping) but architecturally shows the signature of feature-by-feature organic growth without a repository/service layer ever being introduced. The two structural risks that matter most at scale are **(1) the absent data-access layer** (121 direct DB call sites with convention-only tenant isolation) and **(2) the dual hand-synced schema files with an unsafe type bridge**. Everything else — God components, duplicated hooks, scattered env access, inconsistent module boundaries — is real technical debt but individually recoverable; the data-access and schema issues are the ones that turn into production incidents as tenant count grows.

The architecture comfortably serves **10–100 tenants** today. Reaching **1,000+** requires introducing a real data-access layer, making Redis-backed realtime mandatory, and adding a caching tier — not new features, but foundational rework. Reaching **10,000** requires that rework plus DB read-scaling (replicas/sharding) and a non-polling realtime transport.

PHASE 2 COMPLETE

