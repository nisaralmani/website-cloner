/**
 * Graceful shutdown coordinator (Phase 24C, STEP 7).
 *
 * On SIGTERM/SIGINT: stop accepting new jobs, stop schedulers, then wait for
 * in-flight jobs to finish up to a bounded drain window. If the window elapses,
 * cancel the stragglers via the shared shutdown token (cooperative jobs abort
 * their fetches/timers). This integrates with — and does not replace — the
 * existing Redis disconnect hooks in `@/lib/infra/redis-client` (STEP: Redis
 * architecture is out of scope / must not be touched).
 *
 * Idempotent and safe to register from the instrumentation hook.
 */

import { jobShutdownDrainMs } from "@/lib/config";
import { getShutdownToken } from "@/lib/jobs/lifecycle";
import { createComponentLogger } from "@/lib/logging/logger";
import {
  runningJobCount,
  stopAcceptingJobs,
} from "@/lib/jobs/registry";
import { stopAllScheduledJobs } from "@/lib/jobs/scheduler";
import { getReliabilityHealth } from "@/lib/reliability/health";

const log = createComponentLogger("job-shutdown");

const POLL_INTERVAL_MS = 200;

const globalStore = globalThis as typeof globalThis & {
  __bybeltJobShutdownRegistered?: boolean;
  __bybeltJobDraining?: Promise<void>;
};

/** Centralized parse (Phase 25) — see `@/lib/config`. */
function drainTimeoutMs(): number {
  return jobShutdownDrainMs();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Begin draining: stop intake + schedulers, await in-flight jobs, then cancel
 * any stragglers. Returns when the pool is empty or the drain window elapses.
 * Idempotent — concurrent callers share one drain.
 */
export function drainJobs(reason = "shutdown"): Promise<void> {
  if (globalStore.__bybeltJobDraining) return globalStore.__bybeltJobDraining;

  globalStore.__bybeltJobDraining = (async () => {
    const startedAt = Date.now();
    stopAcceptingJobs();
    stopAllScheduledJobs();

    const deadline = Date.now() + drainTimeoutMs();
    const initial = runningJobCount();
    log.info("job_drain_started", {
      runningJobs: initial,
      reason,
      drainWindowMs: drainTimeoutMs(),
    });

    while (runningJobCount() > 0 && Date.now() < deadline) {
      await delay(POLL_INTERVAL_MS);
    }

    let cancelled = 0;
    const remaining = runningJobCount();
    if (remaining > 0) {
      cancelled = remaining;
      log.warn("job_drain_timeout_cancel", { remaining, reason });
      // Cooperative cancel of stragglers via the shared token.
      getShutdownToken().cancel(reason);
      // Give cancelled jobs a brief grace period to unwind.
      const graceDeadline = Date.now() + 2_000;
      while (runningJobCount() > 0 && Date.now() < graceDeadline) {
        await delay(POLL_INTERVAL_MS);
      }
    }

    // Operator diagnostics (STEP 5): a recovery summary of what drained cleanly
    // vs. was cancelled, plus any dependencies still degraded at shutdown.
    const reliability = getReliabilityHealth();
    log.info("job_drain_complete", {
      reason,
      startedWith: initial,
      drainedCleanly: Math.max(0, initial - cancelled),
      cancelled,
      remaining: runningJobCount(),
      durationMs: Date.now() - startedAt,
      degradedDependencies: reliability.degradedDependencies,
    });
  })();

  return globalStore.__bybeltJobDraining;
}

/**
 * Register process-signal handlers that drain jobs before exit. Safe to call
 * multiple times; only the first call attaches handlers. Node.js runtime only.
 */
export function registerJobShutdownHooks(): void {
  if (globalStore.__bybeltJobShutdownRegistered) return;
  if (typeof process === "undefined" || typeof process.on !== "function") return;
  globalStore.__bybeltJobShutdownRegistered = true;

  const handle = (signal: string) => {
    log.info("shutdown_signal", { signal });
    void drainJobs(`signal:${signal}`);
  };

  process.once("SIGTERM", () => handle("SIGTERM"));
  process.once("SIGINT", () => handle("SIGINT"));
  process.once("beforeExit", () => {
    if (runningJobCount() > 0) void drainJobs("beforeExit");
  });

  log.info("job_shutdown_hooks_registered", { drainTimeoutMs: drainTimeoutMs() });
}
