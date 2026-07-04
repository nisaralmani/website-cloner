/**
 * Job failure classification (Phase 24C, STEP 5).
 *
 * Single, standardized taxonomy for why a background job failed. This replaces
 * ad-hoc, per-caller error inspection: the runner classifies every thrown error
 * once, and the retry policy + metrics read the resulting category. It reuses
 * the existing {@link HttpClientError} taxonomy from `@/lib/http/client` rather
 * than re-implementing HTTP error detection.
 */

import { HttpClientError } from "@/lib/http/client";

/**
 * Standardized failure categories. Ordering is not significant; the boolean
 * retryability of each category is defined by {@link RETRYABLE_CATEGORIES}.
 */
export const JobFailureCategory = {
  /** The job exceeded its time budget (timeout / AbortError). */
  Timeout: "timeout",
  /** Transient transport failure (DNS, connection reset, fetch failure). */
  Network: "network",
  /** Explicitly transient and safe to retry (e.g. 5xx, 429 without a category). */
  Retryable: "retryable",
  /** Deterministic failure that will not succeed on retry (e.g. 4xx bug). */
  Permanent: "permanent",
  /** Input/precondition validation failed — retrying is pointless. */
  Validation: "validation",
  /** Auth/authorization failure (401/403, bad secret). */
  Authentication: "authentication",
  /** Provider rate limit (429 / Retry-After). Retryable with backoff. */
  RateLimited: "rate_limited",
  /** The job was cancelled (shutdown or explicit cancellation token). */
  Cancelled: "cancelled",
  /**
   * A circuit breaker for the target dependency is open — the call was
   * short-circuited (Phase 24D). Not retried in-run (fail fast); recovery
   * treats it as a cooldown.
   */
  CircuitOpen: "circuit_open",
  /** Could not be classified. */
  Unknown: "unknown",
} as const;

export type JobFailureCategory =
  (typeof JobFailureCategory)[keyof typeof JobFailureCategory];

/** Categories that are transient and worth retrying by default. */
const RETRYABLE_CATEGORIES: ReadonlySet<JobFailureCategory> = new Set([
  JobFailureCategory.Timeout,
  JobFailureCategory.Network,
  JobFailureCategory.Retryable,
  JobFailureCategory.RateLimited,
]);

/** Whether a category is retryable in the absence of an explicit override. */
export function isRetryableCategory(category: JobFailureCategory): boolean {
  return RETRYABLE_CATEGORIES.has(category);
}

/**
 * A classified job error. Callers may throw this directly to force a category
 * (e.g. `throw new JobError("bad shop", JobFailureCategory.Validation)`), or
 * throw any error and let {@link classifyFailure} categorize it.
 */
export class JobError extends Error {
  readonly category: JobFailureCategory;
  readonly retryable: boolean;

  constructor(
    message: string,
    category: JobFailureCategory = JobFailureCategory.Unknown,
    options?: { cause?: unknown; retryable?: boolean },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "JobError";
    this.category = category;
    this.retryable = options?.retryable ?? isRetryableCategory(category);
  }
}

/** Cancellation is modeled as a JobError subclass for `instanceof` checks. */
export class JobCancelledError extends JobError {
  constructor(message = "Job cancelled") {
    super(message, JobFailureCategory.Cancelled, { retryable: false });
    this.name = "JobCancelledError";
  }
}

function isAbortLike(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function classifyHttp(error: HttpClientError): JobFailureCategory {
  if (error.kind === "timeout" || error.kind === "abort") {
    return JobFailureCategory.Timeout;
  }
  if (error.kind === "network") {
    return JobFailureCategory.Network;
  }
  // kind === "http": refine by status.
  const status = error.status ?? 0;
  if (status === 401 || status === 403) return JobFailureCategory.Authentication;
  if (status === 429) return JobFailureCategory.RateLimited;
  if (status === 400 || status === 404 || status === 422) {
    return JobFailureCategory.Validation;
  }
  if (status >= 500) return JobFailureCategory.Retryable;
  if (status >= 400) return JobFailureCategory.Permanent;
  return JobFailureCategory.Unknown;
}

/**
 * Classify an arbitrary thrown value into a {@link JobFailureCategory}.
 * Never throws.
 */
export function classifyFailure(error: unknown): JobFailureCategory {
  if (error instanceof JobError) return error.category;
  if (error instanceof HttpClientError) return classifyHttp(error);
  if (isAbortLike(error)) return JobFailureCategory.Timeout;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (error.name === "TypeError" && message.includes("fetch")) {
      return JobFailureCategory.Network;
    }
    if (message.includes("timed out") || message.includes("timeout")) {
      return JobFailureCategory.Timeout;
    }
    if (message.includes("econnrefused") || message.includes("network")) {
      return JobFailureCategory.Network;
    }
    if (message.includes("unauthorized") || message.includes("forbidden")) {
      return JobFailureCategory.Authentication;
    }
    if (message.includes("rate limit")) return JobFailureCategory.RateLimited;
    if (message.includes("validation") || message.includes("invalid")) {
      return JobFailureCategory.Validation;
    }
  }

  return JobFailureCategory.Unknown;
}

/** Human-safe one-line reason for a failed job (for metrics/logging). */
export function describeFailure(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
