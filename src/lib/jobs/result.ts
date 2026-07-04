/**
 * Job result + execution record (Phase 24C, STEP 2 + STEP 6).
 *
 * The runner never throws for job-body failures — it returns a discriminated
 * {@link JobResult}. A `JobExecutionRecord` is the metrics-shaped summary of one
 * execution (all attempts), the single structure the metrics store and health
 * snapshot consume.
 */

import type { JobFailureCategory } from "@/lib/jobs/failure";

/** Terminal outcome of a job execution. */
export type JobOutcome = "success" | "failed" | "cancelled";

export type JobSuccess<T> = {
  ok: true;
  outcome: "success";
  value: T;
  jobName: string;
  jobId: string;
  attempts: number;
  durationMs: number;
  /** True when an idempotency hook short-circuited execution (no work ran). */
  deduped?: boolean;
};

export type JobFailure = {
  ok: false;
  outcome: "failed" | "cancelled";
  error: unknown;
  category: JobFailureCategory;
  failureReason: string;
  jobName: string;
  jobId: string;
  attempts: number;
  durationMs: number;
  /** Recovery decision taken by the runner (Phase 24D). */
  recovery?: "retry" | "cooldown" | "dead-letter" | "give-up";
};

export type JobResult<T> = JobSuccess<T> | JobFailure;

/**
 * Metrics record for one job execution (STEP 6). Deliberately flat and
 * serializable — this is what the health endpoint and the metrics ring buffer
 * expose. No external metrics provider; architecture only.
 */
export type JobExecutionRecord = {
  jobName: string;
  jobId: string;
  outcome: JobOutcome;
  success: boolean;
  attempts: number;
  durationMs: number;
  failureReason?: string;
  category?: JobFailureCategory;
  requestId?: string;
  workspaceId?: string | null;
  conversationId?: string | null;
  /** ISO timestamp when the execution finished. */
  finishedAt: string;
};

export function isJobSuccess<T>(result: JobResult<T>): result is JobSuccess<T> {
  return result.ok;
}
