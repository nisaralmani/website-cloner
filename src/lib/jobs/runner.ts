/**
 * Job runner (Phase 24C, STEP 2 + STEP 3 + STEP 6).
 *
 * The single execution engine every background task runs through. One call:
 *   - builds a {@link JobContext} with correlation + logger + cancellation,
 *   - enforces an optional per-attempt timeout,
 *   - retries per the resolved {@link RetryPolicy} (exponential backoff + jitter),
 *   - honors idempotency hooks (skip on duplicate),
 *   - registers itself for graceful-shutdown draining + health,
 *   - records one metrics execution + emits structured logs,
 *   - never throws for a job-body failure — returns a {@link JobResult}.
 *
 * This removes every bespoke retry/try-catch/backoff loop: callers describe
 * intent (retry policy, timeout) and read a typed result.
 */

import { CancellationToken, linkCancellation } from "@/lib/jobs/cancellation";
import type { JobContext, JobCorrelation, JobFn } from "@/lib/jobs/context";
import {
  classifyFailure,
  describeFailure,
  JobCancelledError,
  JobError,
  JobFailureCategory,
} from "@/lib/jobs/failure";
import { getShutdownToken } from "@/lib/jobs/lifecycle";
import { recordJobExecution } from "@/lib/jobs/metrics";
import {
  decrementQueued,
  incrementQueued,
  isAcceptingJobs,
  registerRunningJob,
  unregisterRunningJob,
} from "@/lib/jobs/registry";
import {
  backoffDelayMs,
  resolveRetryPolicy,
  type RetryPolicy,
} from "@/lib/jobs/retry-policy";
import type { JobExecutionRecord, JobResult } from "@/lib/jobs/result";
import { withCircuitBreaker } from "@/lib/reliability/circuit-breaker";
import { reportFailure } from "@/lib/reliability/failure-reporter";
import {
  decideRecovery,
  type RecoveryDecision,
} from "@/lib/reliability/recovery";
import type { RetryBudgetConfig } from "@/lib/reliability/retry-budget";
import { createComponentLogger } from "@/lib/logging/logger";
import { getRequestContext, getRequestId } from "@/lib/logging/request-context";
import { newRequestId } from "@/lib/logging/request-id";

export type IdempotencyHooks = {
  /** Stable key identifying the unit of work. */
  key: string;
  /** Return true if this key was already processed (skip execution). */
  isDuplicate: (key: string) => Promise<boolean> | boolean;
  /** Mark the key processed after a successful run. */
  markProcessed?: (key: string) => Promise<void> | void;
};

export type RunJobOptions = {
  /** Retry policy overrides (defaults to no retry — behavior-preserving). */
  retry?: Partial<RetryPolicy>;
  /** Per-attempt timeout in ms. Omit for no timeout. */
  timeoutMs?: number;
  /** Correlation ids; default derived from the active request context. */
  correlation?: JobCorrelation;
  /** External cancellation source (linked with the shutdown token). */
  signal?: AbortSignal | CancellationToken;
  /** Idempotency hooks; when the key is a duplicate the job is skipped. */
  idempotency?: IdempotencyHooks;
  /** Report failed executions to the error tracker (default true). */
  captureErrors?: boolean;
  /** Optional stable id (defaults to a fresh request id). */
  jobId?: string;
  /**
   * Phase 24D — guard each attempt with a named circuit breaker (e.g. one of
   * `CIRCUITS`). When the breaker is open the attempt short-circuits and the
   * job fails fast with a `circuit_open` category (no retry).
   */
  circuit?: string;
  /**
   * Phase 24D — consult a named retry budget before each retry so a persistently
   * failing dependency cannot drive unbounded retry volume across runs.
   */
  retryBudget?: string;
  retryBudgetConfig?: Partial<RetryBudgetConfig>;
  /**
   * Whether an exhausted retry is dead-letter eligible (default true) — the
   * hook a future durable dead-letter queue reads. See docs.
   */
  deadLetterOnExhaustion?: boolean;
};

/** No-retry default so migrating a fire-and-forget call changes nothing. */
const DEFAULT_OPTIONS_RETRY: Partial<RetryPolicy> = { maxAttempts: 1 };

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    // Phase 25: remove the abort listener on normal completion so the timer
    // and listener never outlive the sleep (no dangling handler on the signal).
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function resolveCorrelation(explicit?: JobCorrelation): JobCorrelation {
  const ctx = getRequestContext();
  return {
    requestId: explicit?.requestId ?? getRequestId(),
    workspaceId: explicit?.workspaceId ?? ctx?.workspaceId ?? null,
    conversationId: explicit?.conversationId ?? ctx?.conversationId ?? null,
    shop: explicit?.shop ?? ctx?.shop ?? null,
  };
}

/**
 * Race a job body against a timeout token. Cooperative jobs abort via
 * `ctx.signal`; non-cooperative ones have their result discarded once the
 * timeout token fires (the runner stops waiting and reports a Timeout).
 */
function runAttempt<T>(
  fn: JobFn<T>,
  ctx: JobContext,
  timeoutMs?: number,
): Promise<T> {
  const body = Promise.resolve().then(() => fn(ctx));
  if (!timeoutMs || timeoutMs <= 0) return body;

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      ctx.cancellation.cancel("timeout");
      reject(new JobError(`Job timed out after ${timeoutMs}ms`, JobFailureCategory.Timeout));
    }, timeoutMs);

    body.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Execute a job with retry/timeout/cancellation/idempotency/metrics.
 * Never throws for a job-body failure — inspect the returned {@link JobResult}.
 */
export async function runJob<T>(
  jobName: string,
  fn: JobFn<T>,
  options: RunJobOptions = {},
): Promise<JobResult<T>> {
  const jobId = options.jobId ?? newRequestId();
  const policy = resolveRetryPolicy(options.retry ?? DEFAULT_OPTIONS_RETRY);
  const correlation = resolveCorrelation(options.correlation);
  const captureErrors = options.captureErrors ?? true;
  const startedAt = Date.now();

  const baseLogger = createComponentLogger(`job:${jobName}`);
  const log = {
    debug: (m: string, f?: Record<string, unknown>) =>
      baseLogger.debug(m, { jobName, jobId, ...correlationFields(correlation), ...f }),
    info: (m: string, f?: Record<string, unknown>) =>
      baseLogger.info(m, { jobName, jobId, ...correlationFields(correlation), ...f }),
    warn: (m: string, f?: Record<string, unknown>) =>
      baseLogger.warn(m, { jobName, jobId, ...correlationFields(correlation), ...f }),
    error: (m: string, f?: Record<string, unknown>) =>
      baseLogger.error(m, { jobName, jobId, ...correlationFields(correlation), ...f }),
  };

  // Reject work once shutdown has begun — do not start new jobs.
  if (!isAcceptingJobs()) {
    const record = finalRecord(
      jobName,
      jobId,
      "cancelled",
      1,
      Date.now() - startedAt,
      correlation,
      JobFailureCategory.Cancelled,
      "rejected: shutting down",
    );
    recordJobExecution(record);
    return {
      ok: false,
      outcome: "cancelled",
      error: new JobCancelledError("rejected: shutting down"),
      category: JobFailureCategory.Cancelled,
      failureReason: "rejected: shutting down",
      jobName,
      jobId,
      attempts: 1,
      durationMs: Date.now() - startedAt,
    };
  }

  // Idempotency: skip duplicates before doing any work.
  if (options.idempotency) {
    try {
      const dup = await options.idempotency.isDuplicate(options.idempotency.key);
      if (dup) {
        log.info("job_deduped", { idempotencyKey: options.idempotency.key });
        const record = finalRecord(
          jobName,
          jobId,
          "success",
          0,
          Date.now() - startedAt,
          correlation,
        );
        recordJobExecution(record);
        return {
          ok: true,
          outcome: "success",
          value: undefined as unknown as T,
          jobName,
          jobId,
          attempts: 0,
          durationMs: Date.now() - startedAt,
          deduped: true,
        };
      }
    } catch (error) {
      // An idempotency-store failure must not lose the job — log and proceed.
      log.warn("job_idempotency_check_failed", { error: describeFailure(error) });
    }
  }

  let attempt = 0;
  let lastError: unknown;
  let lastDecision: RecoveryDecision | undefined;

  incrementQueued();
  while (attempt < policy.maxAttempts) {
    attempt += 1;

    // Link per-attempt cancellation to the external signal + shutdown token.
    const cancellation = linkCancellation([
      options.signal,
      getShutdownToken(),
    ]);

    const ctx: JobContext = {
      jobName,
      jobId,
      attempt,
      maxAttempts: policy.maxAttempts,
      correlation,
      logger: baseLogger,
      cancellation,
      signal: cancellation.signal,
      isCancelled: () => cancellation.cancelled,
      throwIfCancelled: () => cancellation.throwIfCancelled(),
    };

    registerRunningJob({
      jobName,
      jobId,
      attempt,
      startedAt: Date.now(),
      cancellation,
      workspaceId: correlation.workspaceId ?? null,
    });
    if (attempt === 1) decrementQueued();

    log.info("job_attempt_start", { attempt, maxAttempts: policy.maxAttempts });

    try {
      cancellation.throwIfCancelled();
      const value = options.circuit
        ? await withCircuitBreaker(options.circuit, () =>
            runAttempt(fn, ctx, options.timeoutMs),
          )
        : await runAttempt(fn, ctx, options.timeoutMs);
      unregisterRunningJob(jobId);

      if (options.idempotency?.markProcessed) {
        try {
          await options.idempotency.markProcessed(options.idempotency.key);
        } catch (error) {
          log.warn("job_mark_processed_failed", { error: describeFailure(error) });
        }
      }

      const durationMs = Date.now() - startedAt;
      log.info("job_succeeded", { attempt, durationMs });
      recordJobExecution(
        finalRecord(jobName, jobId, "success", attempt, durationMs, correlation),
      );
      return {
        ok: true,
        outcome: "success",
        value,
        jobName,
        jobId,
        attempts: attempt,
        durationMs,
      };
    } catch (error) {
      unregisterRunningJob(jobId);
      lastError = error;
      const category = classifyFailure(error);
      const cancelled =
        category === JobFailureCategory.Cancelled || cancellation.cancelled;

      if (cancelled && cancellation.reason === "shutdown") {
        // Shutdown-cancelled work is terminal — do not burn retries.
        lastDecision = {
          action: "give-up",
          reason: "cancelled",
          category,
          retryable: false,
          shouldRetry: false,
        };
        break;
      }

      // Phase 24D — single recovery decision engine (classify + attempt budget
      // + cross-run retry budget + circuit state). Replaces the bespoke
      // shouldRetry gate while preserving the caller's shouldRetry override.
      lastDecision = decideRecovery({
        error,
        attempt,
        cancelled,
        policy: {
          maxAttempts: policy.maxAttempts,
          budgetName: options.retryBudget,
          budgetConfig: options.retryBudgetConfig,
          deadLetterOnExhaustion: options.deadLetterOnExhaustion,
          shouldRetry: policy.shouldRetry,
        },
      });

      log.warn("job_attempt_failed", {
        attempt,
        category,
        willRetry: lastDecision.shouldRetry,
        recovery: lastDecision.action,
        recoveryReason: lastDecision.reason,
        error: describeFailure(error),
      });

      if (!lastDecision.shouldRetry) break;

      const delay = lastDecision.cooldownMs ?? backoffDelayMs(policy, attempt);
      log.info("job_retry_scheduled", { attempt, delayMs: delay });
      await sleep(delay, cancellation.signal);
    }
  }

  const durationMs = Date.now() - startedAt;
  const category = classifyFailure(lastError);
  const outcome = category === JobFailureCategory.Cancelled ? "cancelled" : "failed";
  const failureReason = describeFailure(lastError);
  const recovery = lastDecision?.action;

  recordJobExecution(
    finalRecord(jobName, jobId, outcome, attempt, durationMs, correlation, category, failureReason),
  );

  // Phase 24D — every terminal failure is reported through the single failure
  // reporter (structured + correlated + recovery-tagged). `captureErrors:false`
  // (e.g. best-effort webhook delivery) suppresses error-tracker capture but
  // still logs + records. Cancellations are not reported as failures.
  if (outcome === "failed") {
    reportFailure({
      error: lastError,
      component: `job:${jobName}`,
      jobName,
      jobId,
      category,
      retryable: lastDecision?.retryable,
      recovery,
      attempts: attempt,
      workspaceId: correlation.workspaceId,
      conversationId: correlation.conversationId,
      capture: captureErrors ? undefined : false,
      extra: { durationMs, requestId: correlation.requestId },
    });
  }

  log[outcome === "failed" ? "error" : "warn"]("job_failed", {
    attempts: attempt,
    durationMs,
    category,
    outcome,
    recovery,
    error: failureReason,
  });

  return {
    ok: false,
    outcome,
    error: lastError,
    category,
    failureReason,
    recovery,
    jobName,
    jobId,
    attempts: attempt,
    durationMs,
  };
}

/**
 * Convenience wrapper for fire-and-forget jobs: runs {@link runJob} detached and
 * swallows the result (already logged + metered). Use where the caller cannot
 * await (e.g. inside a request that must return immediately).
 */
export function runJobDetached<T>(
  jobName: string,
  fn: JobFn<T>,
  options: RunJobOptions = {},
): void {
  void runJob(jobName, fn, options);
}

function correlationFields(correlation: JobCorrelation): Record<string, unknown> {
  return {
    requestId: correlation.requestId,
    workspaceId: correlation.workspaceId ?? undefined,
    conversationId: correlation.conversationId ?? undefined,
    shop: correlation.shop ?? undefined,
  };
}

function finalRecord(
  jobName: string,
  jobId: string,
  outcome: JobExecutionRecord["outcome"],
  attempts: number,
  durationMs: number,
  correlation: JobCorrelation,
  category?: JobFailureCategory,
  failureReason?: string,
): JobExecutionRecord {
  return {
    jobName,
    jobId,
    outcome,
    success: outcome === "success",
    attempts,
    durationMs,
    failureReason,
    category,
    requestId: correlation.requestId,
    workspaceId: correlation.workspaceId ?? null,
    conversationId: correlation.conversationId ?? null,
    finishedAt: new Date().toISOString(),
  };
}
