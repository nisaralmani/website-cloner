# Production Readiness & Launch Operations (Phase 25)

Operational guide for running Bybelt in production (billing excluded). Covers the
startup/shutdown lifecycle, deployment flow, a launch checklist, troubleshooting,
and recovery procedures. Builds on Phase 18 (config/health) and Phases 24A–24D
(Redis, correlation, jobs, reliability).

## Startup lifecycle

`src/instrumentation.ts` → `register()` runs once on server boot (Node.js runtime
only; the edge runtime is skipped) and performs, in order:

1. **`runStartupValidation()`** (`src/lib/startup.ts`)
   - `validateConfig()` — validates required + optional configuration.
   - Emits `startup` (version, env, dialect, node version, drain window),
     one `startup_feature` line per optional subsystem (redis / bridge / email /
     ai), then per-warning / per-error lines, then `startup_complete`.
   - **Fails fast in production** if required config is invalid (throws → the
     process refuses to serve traffic). Never aborts during `next build`.
2. **`registerJobShutdownHooks()`** (Phase 24C) — attaches SIGTERM/SIGINT/beforeExit drain handlers.
3. **`registerReliabilityDefaults()`** (Phase 24D) — pre-registers circuit breakers + retry budgets so they are visible in health from boot.

Each step is guarded to run exactly once per process (idempotent).

## Shutdown lifecycle

On `SIGTERM` / `SIGINT` (Docker `stop`, orchestrator scale-down):

1. `drainJobs()` stops accepting new jobs and stops all schedulers.
2. Waits up to `JOB_SHUTDOWN_DRAIN_MS` (default **25s**) for in-flight jobs.
3. Cancels any stragglers via the shared shutdown token (cooperative abort).
4. Logs `job_drain_complete` with a **recovery summary**: started-with,
   drained-cleanly, cancelled, remaining, duration, and any degraded dependencies.

Redis disconnect hooks (`src/lib/infra/redis-client.ts`, Phase 24A) fire on the
same signals and are unchanged by this phase. Late fan-out messages published
during the drain are best-effort (`enableOfflineQueue:false`) and safely dropped.

> **Deployment requirement:** the container stop grace period must exceed the
> drain window + 2s grace. `docker-compose.prod.yml` sets `stop_grace_period: 30s`
> and the Dockerfile declares `STOPSIGNAL SIGTERM`. If you deploy elsewhere
> (k8s `terminationGracePeriodSeconds`, systemd `TimeoutStopSec`), set it ≥ 30s
> or lower `JOB_SHUTDOWN_DRAIN_MS` to match.

## Deployment flow

1. `docker compose -f docker-compose.prod.yml build` — multi-stage build,
   standalone output, non-root `node` user.
2. Provide `.env.production` (see checklist). Production **refuses to boot**
   without a Postgres `DATABASE_URL` and `SESSION_SECRET` (fail-closed).
3. `docker compose -f docker-compose.prod.yml up -d`.
4. The container `HEALTHCHECK` polls `/api/health` (30s interval, 40s start
   period). Non-200 (DB down or invalid config) marks the container unhealthy.
5. `restart: unless-stopped` restarts on crash; graceful SIGTERM on stop.

## Production checklist

**Required (boot fails without these in production):**
- `DATABASE_URL` — PostgreSQL (no SQLite fallback in prod).
- `SESSION_SECRET` — session signing.
- `BYBELT_INTERNAL_SECRET` — internal bridge auth.

**Recommended / feature-gating (warned at startup if missing/incoherent):**
- `REDIS_URL` — required for **multi-instance** realtime; single instance runs
  in-memory. Running >1 replica without it silently drops cross-instance events.
- `OPENAI_API_KEY` (+ `OPENAI_MODEL`) — AI replies; falls back to templates.
- `CRON_SECRET` — required to authenticate the poll-inbox cron when email ingest
  is configured.
- `IMAP_HOST` + `IMAP_USER` + `IMAP_PASS` — inbound email (all three or none).
- `SHOPIFY_PLUGIN_INTERNAL_URL` — bridge target (defaults to `127.0.0.1:3005`);
  requires `BYBELT_INTERNAL_SECRET`.
- `JOB_SHUTDOWN_DRAIN_MS` — drain window (default 25000; must be a positive number).

Startup validation surfaces every missing/incoherent optional feature as a
`startup_config_warning`; check the boot logs and `/api/health` `checks.config`.

## Operational diagnostics

- **`GET /api/health`** — overall status (`healthy` / `degraded` / `unhealthy`),
  version, uptime, and `checks`: `database`, `internalBridge`, `redis`, `jobs`
  (with `jobs.reliability`: circuit breakers, retry budgets, recent failures),
  and `config` (errors + warnings). 503 only when the DB is down or production
  config is invalid; degraded dependencies return 200 + `degraded`.
- **Startup logs** — `startup`, `startup_feature` (per subsystem), config
  warnings/errors, `startup_complete`.
- **Job/reliability logs** — `job_metric` per execution, `failure_reported` for
  terminal failures, circuit `failure_reported` / breaker transitions.

## Troubleshooting

| Symptom | Likely cause | Where to look |
|---|---|---|
| Container never becomes healthy | DB unreachable or invalid prod config | `/api/health` `checks.database` / `checks.config`; `startup_config_error` logs |
| Process exits immediately on boot | `startup_aborted` — missing `DATABASE_URL`/secret | boot logs; production checklist |
| Realtime updates missing across replicas | `REDIS_URL` unset with >1 instance | `startup_feature redis-realtime:false`; set `REDIS_URL` |
| Inbound email not arriving | `CRON_SECRET` unset, or IMAP creds incomplete | `startup_config_warning` for `CRON_SECRET`/`IMAP_USER` |
| A dependency shows `degraded` | circuit breaker open | `/api/health` `jobs.reliability.circuitBreakers` |
| Jobs cut off on deploy | stop grace period < drain window | raise `stop_grace_period` / lower `JOB_SHUTDOWN_DRAIN_MS` |

## Recovery procedures

- **Open circuit breaker** — self-heals: after `recoveryTimeoutMs` the breaker
  half-opens and closes on a successful trial. Fix the upstream dependency; no
  restart required. State is visible in `/api/health`.
- **Retry budget exhausted** — refills continuously (`refillPerSec`); once the
  dependency recovers, retries resume automatically.
- **Stuck/degraded instance** — `docker compose restart chat` (graceful SIGTERM →
  drain → restart). The health check will gate traffic during the start period.
- **Config error after deploy** — the process fails fast and restarts in a loop
  under `restart: unless-stopped`; fix `.env.production` and redeploy.

## Rollback (this phase)

All Phase 25 changes are additive/defensive:
1. Revert the new checks + accessors in `src/lib/config/index.ts`.
2. Revert `startup.ts` diagnostics and `jobs/shutdown.ts` summary to their 24C form.
3. Restore the prior env reads in `jobs/shutdown.ts` and `health/checks.ts`.
4. Revert the `imap-poller.ts` cleanup restructure and the runner `sleep` tweak.
5. Remove `stop_grace_period` (compose) and `STOPSIGNAL` (Dockerfile).

No env var was renamed, no schema/Redis/logging/correlation/OAuth/Order-Context/
API-contract change was made; removal restores prior behavior exactly.
