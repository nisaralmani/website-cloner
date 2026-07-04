/**
 * Job execution context (Phase 24C, STEP 2).
 *
 * The single object handed to every job function. It carries correlation data
 * (requestId/workspaceId/conversationId — reused from Phase 24B request
 * context), the active attempt number, a component-scoped {@link JobLogger},
 * and the {@link CancellationToken}. Job code should read cancellation via
 * `ctx.signal`/`ctx.throwIfCancelled()` and never mint its own logger.
 */

import type { CancellationToken } from "@/lib/jobs/cancellation";
import type { Logger } from "@/lib/logging/logger";

/** Correlation identifiers threaded into logs, metrics, and error tracking. */
export type JobCorrelation = {
  requestId?: string;
  workspaceId?: string | null;
  conversationId?: string | null;
  shop?: string | null;
};

/** Logger surface exposed to jobs (a component-scoped {@link Logger}). */
export type JobLogger = Logger;

export type JobContext = {
  /** Stable, human-readable name (e.g. `shopify.bulk-sync`). */
  readonly jobName: string;
  /** Unique id for this execution (correlates all attempts). */
  readonly jobId: string;
  /** 1-based attempt number for the currently-executing attempt. */
  readonly attempt: number;
  /** Total attempts permitted by the resolved retry policy. */
  readonly maxAttempts: number;
  /** Correlation identifiers (may be enriched by the job). */
  readonly correlation: JobCorrelation;
  /** Component-scoped structured logger, pre-bound with job fields. */
  readonly logger: JobLogger;
  /** Cancellation for cooperative shutdown / timeout. */
  readonly cancellation: CancellationToken;
  /** Convenience: the underlying AbortSignal to pass to fetch/timers. */
  readonly signal: AbortSignal;
  /** True once cancellation has been requested. */
  readonly isCancelled: () => boolean;
  /** Throw a JobCancelledError if cancellation was requested. */
  readonly throwIfCancelled: () => void;
};

/** The function form of a job body. */
export type JobFn<T> = (ctx: JobContext) => Promise<T> | T;
