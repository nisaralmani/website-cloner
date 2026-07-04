/**
 * Jobs health snapshot (Phase 24C, STEP 8).
 *
 * Read-only view of the job subsystem for the existing /api/health endpoint —
 * running/queued/failed counts, last execution, and a degraded flag. This does
 * NOT create a new health endpoint; `checkJobs()` in `@/lib/health/checks` maps
 * this into the shared health response.
 */

import { isShuttingDown } from "@/lib/jobs/lifecycle";
import { snapshotJobMetrics } from "@/lib/jobs/metrics";
import {
  queuedJobCount,
  runningJobCount,
  runningJobs,
} from "@/lib/jobs/registry";

export type JobsHealth = {
  status: "ok" | "degraded" | "draining";
  running: number;
  queued: number;
  failed: number;
  succeeded: number;
  executions: number;
  lastExecutionAt: string | null;
  draining: boolean;
  runningJobs: Array<{ jobName: string; jobId: string; ageMs: number }>;
  recentFailures: Array<{ jobName: string; failureReason?: string; category?: string }>;
};

/**
 * Degraded when there are recent failures at a meaningful rate. Draining takes
 * precedence (shutdown in progress). Never throws.
 */
export function getJobsHealth(): JobsHealth {
  const metrics = snapshotJobMetrics();
  const draining = isShuttingDown();
  const now = Date.now();

  const failureRate =
    metrics.totals.executions > 0
      ? metrics.totals.failed / metrics.totals.executions
      : 0;

  // Degraded if a job type is currently failing on its latest run AND overall
  // failure rate is non-trivial — avoids flapping on a single historical error.
  const hasFailingJob = metrics.perJob.some(
    (job) => job.lastOutcome === "failed" && job.failureRate >= 0.5,
  );
  const degraded = hasFailingJob && failureRate >= 0.25;

  const status: JobsHealth["status"] = draining
    ? "draining"
    : degraded
      ? "degraded"
      : "ok";

  return {
    status,
    running: runningJobCount(),
    queued: queuedJobCount(),
    failed: metrics.totals.failed,
    succeeded: metrics.totals.succeeded,
    executions: metrics.totals.executions,
    lastExecutionAt: metrics.lastExecutionAt,
    draining,
    runningJobs: runningJobs().map((job) => ({
      jobName: job.jobName,
      jobId: job.jobId,
      ageMs: now - job.startedAt,
    })),
    recentFailures: metrics.recentFailures.map((failure) => ({
      jobName: failure.jobName,
      failureReason: failure.failureReason,
      category: failure.category,
    })),
  };
}
