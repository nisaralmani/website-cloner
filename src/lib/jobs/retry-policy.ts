/**
 * Retry policy (Phase 24C, STEP 3).
 *
 * A single, declarative description of how a job retries: attempt count,
 * exponential backoff with full jitter, an optional delay cap, and a
 * category-aware `shouldRetry` predicate. The runner is the only consumer —
 * there is exactly one retry loop in the codebase (this one plus the
 * pre-existing HTTP-client loop, which this deliberately mirrors so behavior is
 * consistent).
 */

import {
  classifyFailure,
  isRetryableCategory,
  JobFailureCategory,
} from "@/lib/jobs/failure";

export type RetryPolicy = {
  /** Total attempts including the first. `1` disables retry. */
  maxAttempts: number;
  /** Base backoff in ms for the first retry. */
  baseDelayMs: number;
  /** Upper bound on any single backoff delay. */
  maxDelayMs: number;
  /**
   * Jitter strategy applied to the exponential delay:
   * - `full`: delay in [0, exp] (default; decorrelates thundering herds)
   * - `equal`: delay in [exp/2, exp]
   * - `none`: exactly exp
   */
  jitter: "full" | "equal" | "none";
  /**
   * Decide whether a failed attempt should be retried. Defaults to
   * category-based retryability from {@link isRetryableCategory}.
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 5_000,
  jitter: "full",
};

/** A policy that never retries — the default for behavior-preserving migrations. */
export const NO_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 1,
  baseDelayMs: 0,
  maxDelayMs: 0,
  jitter: "none",
};

export function resolveRetryPolicy(policy?: Partial<RetryPolicy>): RetryPolicy {
  if (!policy) return DEFAULT_RETRY_POLICY;
  return { ...DEFAULT_RETRY_POLICY, ...policy };
}

/**
 * Compute the backoff delay before a given retry `attempt` (1-based: the delay
 * *after* attempt 1 fails). `rng` is injectable for deterministic tests.
 */
export function backoffDelayMs(
  policy: RetryPolicy,
  attempt: number,
  rng: () => number = Math.random,
): number {
  const exponential = policy.baseDelayMs * 2 ** Math.max(0, attempt - 1);
  const capped = Math.min(policy.maxDelayMs, exponential);
  switch (policy.jitter) {
    case "none":
      return Math.round(capped);
    case "equal":
      return Math.round(capped / 2 + (capped / 2) * rng());
    case "full":
    default:
      return Math.round(capped * rng());
  }
}

/**
 * Whether the runner should retry after a failed attempt, honoring an explicit
 * `shouldRetry` override, then the attempt budget, then category retryability.
 */
export function shouldRetry(
  policy: RetryPolicy,
  error: unknown,
  attempt: number,
): boolean {
  if (attempt >= policy.maxAttempts) return false;
  if (policy.shouldRetry) return policy.shouldRetry(error, attempt);
  const category = classifyFailure(error);
  if (category === JobFailureCategory.Cancelled) return false;
  return isRetryableCategory(category);
}
