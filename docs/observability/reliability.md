# Production Reliability, Recovery & Resilience (Phase 24D)

Builds on the Phase 24C job framework to make failures **recoverable, observable,
and resilient**. Not features, not billing, not UI — reliability primitives:
structured failure reporting, a single recovery decision engine, circuit
breakers for unstable dependencies, and cross-run retry budgets, all folded into
the existing `/api/health` surface.

> Runtime shape unchanged from 24C: in-process, `globalThis`-backed state (like
> 24A/24C infra), no external libraries, no new endpoint, no schema change.

## Module map (`src/lib/reliability/`)

| Module | Responsibility |
|---|---|
| `failure-reporter.ts` | `reportFailure()` — structured, correlated visibility + dead-letter seam |
| `recovery.ts` | `decideRecovery()` — the one recovery decision engine |
| `circuit-breaker.ts` | `withCircuitBreaker()` + named breaker registry |
| `retry-budget.ts` | token-bucket retry budgets (bound cross-run retry volume) |
| `defaults.ts` | pre-registers service breakers/budgets at boot |
| `health.ts` | `getReliabilityHealth()` for `/api/health` |
| `index.ts` | public surface |

## Recovery lifecycle

A failed job attempt is handled by exactly one function — `decideRecovery()` —
which the runner calls in place of any bespoke retry logic:

```
attempt throws
      │
      ▼
classifyFailure(error)                         (24C taxonomy, reused)
      │
      ├─ cancelled / shutdown ─────────────► give-up   (terminal)
      ├─ circuit_open ─────────────────────► cooldown  (retryAfterMs)
      ├─ non-retryable (validation/auth/…) ─► give-up   (terminal)
      ├─ caller shouldRetry() vetoes ──────► give-up
      ├─ attempt >= maxAttempts ───────────► dead-letter | give-up
      ├─ retry budget empty ───────────────► dead-letter | give-up
      └─ else ─── consume 1 retry token ───► retry      (backoff/jitter or cooldownMs)
```

`RecoveryDecision = { action, reason, category, retryable, shouldRetry, cooldownMs? }`.
`action ∈ retry | cooldown | dead-letter | give-up`. The runner honors
`shouldRetry`, sleeps `cooldownMs ?? backoff`, and tags the terminal
`JobResult.recovery` + failure report with the action.

## Retry lifecycle

Two independent bounds compose:

1. **Per-run** (`RetryPolicy.maxAttempts`, 24C) — caps retries within one run.
2. **Cross-run** (`RetryBudget`, 24D) — a token bucket per named dependency
   (`capacity`, `refillPerSec`). Each granted retry consumes one token; when the
   bucket is empty, retries stop (`budget-exhausted → dead-letter`). This stops a
   persistently-failing dependency from producing a retry storm even though each
   individual run is bounded.

Opt in per job: `runJob(name, fn, { retry: { maxAttempts }, retryBudget: CIRCUITS.shopify })`.

## Circuit breaker lifecycle

```
        failures >= failureThreshold
 closed ───────────────────────────►  open
   ▲                                    │  recoveryTimeoutMs elapsed
   │ successThreshold successes         ▼
   └────────────  half-open  ◄──────────┘
                    │  any failure re-opens
                    └──────────────► open
```

- **closed** — calls flow; consecutive failures counted.
- **open** — calls short-circuit with `CircuitOpenError` (classified
  `circuit_open`, non-retryable) until `recoveryTimeoutMs`.
- **half-open** — up to `halfOpenMaxCalls` trial calls; `successThreshold`
  successes close it, any failure re-opens it.

Use directly — `withCircuitBreaker(name, fn)` — or via the runner —
`runJob(name, fn, { circuit: CIRCUITS.shopify })`. Named breakers for the
platform's unstable dependencies are in `CIRCUITS`
(`shopify`, `openai`, `email`, `internal-bridge`, `workspace-webhooks`) and are
pre-registered at boot by `registerReliabilityDefaults()`.

**Adopted:** workspace webhook delivery uses a **per-endpoint** breaker
(`workspace-webhooks:<url>`) so one failing customer endpoint short-circuits on
its own without affecting healthy endpoints.

## Failure categories

Extends the 24C taxonomy with one category:

| Category | Retryable | Recovery |
|---|:---:|---|
| `timeout`, `network`, `retryable`, `rate_limited` | ✅ | retry (budget permitting) |
| `validation`, `authentication`, `permanent` | ❌ | give-up |
| `circuit_open` *(new in 24D)* | ❌ | cooldown |
| `cancelled` | ❌ | give-up |
| `unknown` | ❌ | give-up |

## Failure reporting flow (STEP 5)

`reportFailure(report)` replaces silent `.catch(() => {})` swallows with
structured, correlated visibility. Every report carries **requestId,
workspaceId, conversationId, jobName, component, category, retryable, recovery
decision**, plus a `deadLetterEligible` flag. It:

1. normalizes + classifies (defaults from the active request context),
2. buffers into a bounded recent-failures ring (for health),
3. logs `failure_reported` (24B structured logger),
4. captures to the error tracker **only for terminal failures**
   (`give-up`/`dead-letter`) or non-retryable errors — never for expected
   transients or cooldowns (an open breaker is already visible in health).

The runner reports every terminal job failure through it. End users never see
internal details — reporting is server-side only.

## Health integration (STEP 7)

`getReliabilityHealth()` feeds `checkJobs()` → **existing `GET /api/health`**
under `checks.jobs.reliability` (no new endpoint):

```jsonc
"jobs": {
  "reliability": {
    "status": "ok",                        // ok | degraded
    "degradedDependencies": [],            // breakers not closed
    "circuitBreakers": [ { "name": "shopify", "state": "closed", ... } ],
    "retryBudgets": [ { "name": "shopify", "available": 30, "exhausted": false, ... } ],
    "recentFailures": [ { "component": "...", "category": "network", "recovery": "retry" } ]
  }
}
```

A degraded reliability state (any breaker open/half-open, or a budget exhausted)
marks overall health `degraded` (200), never 503.

## Extension points

- **Dead-letter queue (STEP 6 — designed, not built).** `FailureReporter` is an
  interface with a swappable active instance (`setFailureReporter`). A durable
  DLQ is added by implementing `report(NormalizedFailure)` to persist records
  where `deadLetterEligible === true`, then calling `setFailureReporter()` at
  boot. No existing caller changes — the runner already tags every terminal
  failure with its recovery action and dead-letter eligibility. Redis (24A) is
  available as the transport.
- **New unstable dependency.** Add a name to `CIRCUITS`, configure it in
  `defaults.ts`, and pass `{ circuit, retryBudget }` to `runJob` (or call
  `withCircuitBreaker` directly).
- **Custom recovery.** Call `decideRecovery(ctx)` directly for non-job code paths
  that need the same retry/cooldown/dead-letter decision.

## Rollback

Additive and low-risk:

1. Remove `circuit` from `webhook-delivery.ts`; restore the `.catch(() => {})`
   in `review-service.ts`.
2. Revert the runner integration (circuit wrap + `decideRecovery`/`reportFailure`
   terminal block) to the 24C `shouldRetry`/`captureException` version.
3. Remove `reliability` from `checkJobs()` and `registerReliabilityDefaults()`
   from `instrumentation.ts`.
4. Remove the `CircuitOpen` category from `jobs/failure.ts` and delete
   `src/lib/reliability/`.

No schema, config, Redis, request-correlation, logging, OAuth, Order Context, or
API-contract change was made, so removal restores prior behavior exactly.
