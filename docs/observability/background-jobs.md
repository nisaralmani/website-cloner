# Background Jobs, Reliability & Resilience (Phase 24C)

A reusable, production-grade execution framework for every asynchronous /
fire-and-forget task in the platform. It is **not** a queue product, not BullMQ,
and not tied to billing — it is the single execution seam that gives any
background operation timeout, retry, cancellation, idempotency, structured
logging, metrics, graceful-shutdown draining, and health integration.

> **Runtime shape.** Bybelt has no standalone worker process. "Background jobs"
> are triggered by cron routes, inbound webhooks, and in-request fire-and-forget
> work. This framework is therefore an **in-process execution wrapper + registry**,
> not a durable queue. Durable queueing (persistent retry / dead-letter) is a
> future extension — see [Future queue integration](#future-queue-integration).

## Module map (`src/lib/jobs/`)

| Module | Responsibility |
|---|---|
| `runner.ts` | `runJob()` / `runJobDetached()` — the one execution engine |
| `context.ts` | `JobContext` handed to every job body |
| `result.ts` | `JobResult` discriminated union + `JobExecutionRecord` |
| `retry-policy.ts` | `RetryPolicy`, backoff + jitter, `shouldRetry` |
| `failure.ts` | `JobFailureCategory`, `JobError`, `classifyFailure` |
| `cancellation.ts` | `CancellationToken` (AbortSignal-backed), `linkCancellation` |
| `lifecycle.ts` | shared process shutdown token |
| `registry.ts` | in-flight tracking + accepting flag (shutdown/health) |
| `metrics.ts` | ring buffer + per-job aggregates + structured emit |
| `scheduler.ts` | `scheduleJob()` — shutdown-aware interval scheduling |
| `shutdown.ts` | signal handlers + `drainJobs()` |
| `health.ts` | `getJobsHealth()` for `/api/health` |
| `index.ts` | public surface |

## Usage

```ts
import { runJob } from "@/lib/jobs";

const result = await runJob(
  "shopify.bulk-sync",
  async (ctx) => {
    ctx.throwIfCancelled();               // cooperative cancellation
    return doWork({ signal: ctx.signal }); // pass signal to fetch/timers
  },
  {
    correlation: { workspaceId },          // defaults from request context
    timeoutMs: 30_000,                     // per-attempt timeout
    retry: { maxAttempts: 3 },             // exponential backoff + jitter
  },
);

if (result.ok) use(result.value);
else log(result.category, result.failureReason); // never throws
```

For a caller that must return immediately (e.g. inside an HTTP handler) use
`runJobDetached(name, fn, opts)`.

## Job lifecycle

```
runJob(name, fn, opts)
      │
      ├─ accepting jobs?  ── no ──► return { ok:false, outcome:"cancelled" }  (shutdown)
      │        │ yes
      ├─ idempotency.isDuplicate(key)? ── yes ──► return { ok:true, deduped:true }
      │        │ no
      ▼
   ┌───────────────── attempt loop (1..maxAttempts) ──────────────────┐
   │  link cancellation (external signal ⊕ shutdown token)            │
   │  register in registry  →  build JobContext                       │
   │  throwIfCancelled()                                              │
   │  runAttempt(fn, ctx, timeoutMs)                                  │
   │        │ success ──► markProcessed(key) ──► record metric ──► return value
   │        │ throw                                                   │
   │        ▼                                                         │
   │  classifyFailure(error)                                          │
   │        ├─ cancelled(shutdown) ──► break (terminal)               │
   │        ├─ shouldRetry? ── yes ──► sleep(backoff+jitter) ──► loop │
   │        └─ no ──► break                                           │
   └──────────────────────────────────────────────────────────────────┘
      │
      ▼
   record metric (failed|cancelled) → captureException (failed only)
      │
      ▼
   return { ok:false, outcome, category, failureReason, attempts, durationMs }
```

Every terminal outcome writes exactly one `JobExecutionRecord` to the metrics
store and emits one `job_metric` structured log line.

## Retry architecture

Retry is described declaratively by `RetryPolicy` and executed by the **single**
retry loop in `runner.ts` (mirroring the pre-existing HTTP-client loop so the two
behave identically). There are no other retry implementations.

- `maxAttempts` — total attempts incl. the first (`1` = no retry, the default for
  behavior-preserving migrations).
- Backoff — `baseDelayMs * 2^(attempt-1)`, capped at `maxDelayMs`.
- Jitter — `full` (default, delay ∈ [0, exp]), `equal` (∈ [exp/2, exp]), or `none`.
- `shouldRetry(error, attempt)` — optional override; otherwise retryability is
  derived from the failure category.

Backoff sleeps are **cancellation-aware**: a shutdown drain wakes a pending
retry sleep immediately instead of blocking the drain window.

## Failure classification

`classifyFailure(error)` maps any thrown value to one standardized category.
It reuses the `HttpClientError` taxonomy from `@/lib/http/client` — no duplicated
HTTP error detection.

| Category | Retryable | Typical source |
|---|:---:|---|
| `timeout` | ✅ | per-attempt timeout, `AbortError` |
| `network` | ✅ | fetch/DNS/connection failure |
| `retryable` | ✅ | HTTP 5xx |
| `rate_limited` | ✅ | HTTP 429 |
| `permanent` | ❌ | non-validation 4xx |
| `validation` | ❌ | HTTP 400/404/422, bad input |
| `authentication` | ❌ | HTTP 401/403, bad secret |
| `cancelled` | ❌ | shutdown / cancellation token |
| `unknown` | ❌ | unclassifiable |

Force a category by throwing `new JobError(msg, JobFailureCategory.Validation)`.

## Cancellation

`CancellationToken` wraps `AbortController`. The runner links each attempt's
token to (a) any external `signal`/token passed in `opts.signal` and (b) the
shared process shutdown token. Job bodies cooperate by passing `ctx.signal` to
`fetch`/timers and/or calling `ctx.throwIfCancelled()` at safe checkpoints.

## Graceful shutdown

Registered from `src/instrumentation.ts` on server boot (Node.js runtime only).
On `SIGTERM`/`SIGINT`, `drainJobs()`:

1. stops accepting new jobs (`stopAcceptingJobs`),
2. stops all schedulers,
3. waits up to `JOB_SHUTDOWN_DRAIN_MS` (default 25s) for in-flight jobs to finish,
4. cancels stragglers via the shared shutdown token and allows a 2s grace unwind.

This composes with — and does not replace — the existing Redis disconnect hooks
in `@/lib/infra/redis-client`. **Redis architecture was not modified.**

## Health integration

`getJobsHealth()` feeds `checkJobs()` in `@/lib/health/checks`, surfaced under
`checks.jobs` in the existing **`GET /api/health`** response (no new endpoint):

```jsonc
"jobs": {
  "status": "ok",              // ok | down (degraded/draining)
  "jobs": {
    "status": "ok",            // ok | degraded | draining
    "running": 0, "queued": 0,
    "failed": 0, "succeeded": 0, "executions": 0,
    "lastExecutionAt": null,
    "draining": false,
    "runningJobs": [], "recentFailures": []
  }
}
```

A degraded/draining job subsystem marks the overall health `degraded` (200) but
never 503s — jobs are not launch-critical like the database.

## Metrics emitted

Per execution (`job_metric` log line + ring buffer): `jobName`, `jobId`,
`outcome`, `success`, `attempt`, `durationMs`, `failureReason`, `category`,
`requestId`, `workspaceId`, `conversationId`. Aggregates per `jobName`: totals,
success/failure/cancelled counts, avg duration, failure rate, last outcome.
No external metrics provider — `snapshotJobMetrics()` is the read seam.

## Jobs migrated (behavior-identical)

| Job name | Site | Change |
|---|---|---|
| `workspace.webhook-delivery` | `webhook-delivery.ts` | raw `fetch` → tracked job (no retry) |
| `workspace.webhook-test` | `webhook-delivery.ts` | tracked job |
| `shopify.bulk-sync` | `sync/cron/route.ts` | per-workspace unit tracked |
| `email.auto-respond` | `imap-poller.ts`, `postmark-inbound.ts` | fire-and-forget → tracked job |

All preserve prior behavior: no new retries, failures still swallowed / reported
exactly as before — the only additions are observability, metrics, and
shutdown-awareness.

## Extension guide

Wrap any new async work in `runJob("<domain>.<action>", fn, opts)`:

- **Idempotent consumer** (webhook): pass `idempotency: { key, isDuplicate, markProcessed }`.
- **External API call**: set `timeoutMs` and `retry` (categories drive retryability).
- **Recurring in-process work**: `scheduleJob(name, fn, { intervalMs })` instead of `setInterval`.
- **Cannot await** (in a request): `runJobDetached(...)`.

Do **not** hand-roll retry/backoff/try-catch loops — describe intent and read the
typed `JobResult`.

## Future queue integration

The runner is queue-agnostic. To add durability later without touching callers:
implement a `JobStore` behind `runJob` that persists `{jobName, payload, idempotencyKey}`
before execution and moves exhausted-retry jobs to a dead-letter table. The
existing `JobExecutionRecord` and `JobFailureCategory` are already the right
shape for a durable audit trail; `idempotency` hooks are the dedup seam; the
`RetryPolicy` is the redelivery schedule. Redis (Phase 24A) is available as the
transport when durable fan-out is required.

## Rollback

Additive and low-risk. To roll back:

1. Revert the four migrated call sites (webhook-delivery, sync cron, imap-poller,
   postmark-inbound) to their prior direct calls.
2. Remove `checkJobs` from `health/checks.ts` + `api/health/route.ts`.
3. Remove `registerJobShutdownHooks()` from `instrumentation.ts`.
4. Delete `src/lib/jobs/`.

No schema, no config, and no Phase 24A/24B module was modified, so removal
restores the prior behavior exactly.
