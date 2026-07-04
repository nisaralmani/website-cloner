/**
 * Background job framework (Phase 24C).
 *
 * Public surface. Every future asynchronous / fire-and-forget task should run
 * through {@link runJob} (or {@link runJobDetached}) so it inherits timeout,
 * retry with backoff + jitter, cancellation, idempotency, structured logging,
 * metrics, graceful-shutdown draining, and health integration.
 *
 * See docs/observability/background-jobs.md for the lifecycle + extension guide.
 */

export { runJob, runJobDetached, type RunJobOptions, type IdempotencyHooks } from "@/lib/jobs/runner";
export { scheduleJob, stopAllScheduledJobs, listScheduledJobs } from "@/lib/jobs/scheduler";
export type { ScheduleOptions, ScheduledJob } from "@/lib/jobs/scheduler";

export type { JobContext, JobCorrelation, JobFn, JobLogger } from "@/lib/jobs/context";
export type {
  JobResult,
  JobSuccess,
  JobFailure,
  JobOutcome,
  JobExecutionRecord,
} from "@/lib/jobs/result";
export { isJobSuccess } from "@/lib/jobs/result";

export {
  JobFailureCategory,
  JobError,
  JobCancelledError,
  classifyFailure,
  describeFailure,
  isRetryableCategory,
} from "@/lib/jobs/failure";

export {
  type RetryPolicy,
  DEFAULT_RETRY_POLICY,
  NO_RETRY_POLICY,
  resolveRetryPolicy,
  backoffDelayMs,
  shouldRetry,
} from "@/lib/jobs/retry-policy";

export {
  CancellationToken,
  neverCancelled,
  linkCancellation,
  type CancellationReason,
} from "@/lib/jobs/cancellation";

export { getShutdownToken, isShuttingDown } from "@/lib/jobs/lifecycle";
export { drainJobs, registerJobShutdownHooks } from "@/lib/jobs/shutdown";
export { getJobsHealth, type JobsHealth } from "@/lib/jobs/health";
export {
  snapshotJobMetrics,
  type JobMetricsSnapshot,
} from "@/lib/jobs/metrics";
export {
  runningJobs,
  runningJobCount,
  queuedJobCount,
  isAcceptingJobs,
} from "@/lib/jobs/registry";
