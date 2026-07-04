/**
 * Failure reporter (Phase 24D, STEP 5 + STEP 6).
 *
 * The single seam for turning a swallowed failure into structured, correlated
 * visibility. Every reported failure carries requestId / workspaceId /
 * conversationId / jobName / component / category / retryable / recovery
 * decision. It reuses Phase 24B logging + error tracking — it does NOT invent a
 * second logging channel.
 *
 * STEP 6 (dead-letter preparation): `FailureReporter` is an interface with a
 * swappable active instance. A future durable dead-letter queue is added by
 * implementing this interface and calling `setFailureReporter()` — no existing
 * caller changes. The `deadLetterEligible` flag on each report is the hook a
 * DLQ implementation reads to decide what to persist.
 */

import type { JobFailureCategory } from "@/lib/jobs/failure";
import { classifyFailure, describeFailure, isRetryableCategory } from "@/lib/jobs/failure";
import { createComponentLogger } from "@/lib/logging/logger";
import { getRequestContext } from "@/lib/logging/request-context";
import { captureException } from "@/lib/observability/error-tracking";

/** The recovery outcome attached to a failure (see recovery.ts). */
export type RecoveryDecisionKind = "retry" | "cooldown" | "dead-letter" | "give-up";

export type FailureReport = {
  /** The underlying error/throwable. */
  error: unknown;
  /** Component that observed the failure (e.g. `job:email.auto-respond`). */
  component: string;
  /** Job name when the failure occurred inside a job run. */
  jobName?: string;
  jobId?: string;
  /** Classified failure category. Derived from `error` when omitted. */
  category?: JobFailureCategory;
  /** Whether the category is retryable. Derived when omitted. */
  retryable?: boolean;
  /** The recovery decision taken (if any). */
  recovery?: RecoveryDecisionKind;
  /** How many attempts had been made. */
  attempts?: number;
  /** Correlation overrides; default from the active request context. */
  requestId?: string;
  workspaceId?: string | null;
  conversationId?: string | null;
  /** Whether this failure should be captured to the error tracker. */
  capture?: boolean;
  /** Extra structured context. */
  extra?: Record<string, unknown>;
};

export type NormalizedFailure = {
  message: string;
  component: string;
  jobName?: string;
  jobId?: string;
  category: JobFailureCategory;
  retryable: boolean;
  recovery?: RecoveryDecisionKind;
  attempts?: number;
  requestId?: string;
  workspaceId?: string | null;
  conversationId?: string | null;
  /** True when a future dead-letter queue should persist this failure. */
  deadLetterEligible: boolean;
  finishedAt: string;
};

export interface FailureReporter {
  report(failure: NormalizedFailure, raw: FailureReport): void;
}

const RECENT_BUFFER_SIZE = 100;

type ReporterState = {
  reporter: FailureReporter;
  recent: NormalizedFailure[];
};

const globalStore = globalThis as typeof globalThis & {
  __bybeltFailureReporter?: ReporterState;
};

const log = createComponentLogger("failure-reporter");

/**
 * A failure is dead-letter-eligible when retries are exhausted or the decision
 * is explicitly terminal — i.e. a durable DLQ would want to keep it for later
 * inspection / replay.
 */
function isDeadLetterEligible(recovery?: RecoveryDecisionKind): boolean {
  return recovery === "dead-letter" || recovery === "give-up";
}

/** Default reporter: structured log + optional error-tracker capture. */
class DefaultFailureReporter implements FailureReporter {
  report(failure: NormalizedFailure, raw: FailureReport): void {
    log.error("failure_reported", {
      event: "failure_reported",
      component: failure.component,
      jobName: failure.jobName,
      jobId: failure.jobId,
      category: failure.category,
      retryable: failure.retryable,
      recovery: failure.recovery,
      attempts: failure.attempts,
      deadLetterEligible: failure.deadLetterEligible,
      requestId: failure.requestId,
      workspaceId: failure.workspaceId ?? undefined,
      conversationId: failure.conversationId ?? undefined,
      error: failure.message,
      ...raw.extra,
    });

    // Route to the error tracker for terminal failures (give-up / dead-letter)
    // and non-retryable errors; never for expected transients or cooldowns
    // (an open breaker is already visible in health). Avoids alert noise.
    const terminal =
      failure.recovery === "dead-letter" || failure.recovery === "give-up";
    const shouldCapture =
      raw.capture ?? (failure.recovery ? terminal : !failure.retryable);
    if (shouldCapture) {
      captureException(raw.error, {
        component: failure.component,
        workspaceId: failure.workspaceId,
        conversationId: failure.conversationId,
        tags: {
          jobName: failure.jobName ?? "none",
          category: failure.category,
          recovery: failure.recovery ?? "none",
        },
        extra: { attempts: failure.attempts, ...raw.extra },
      });
    }
  }
}

function getState(): ReporterState {
  if (!globalStore.__bybeltFailureReporter) {
    globalStore.__bybeltFailureReporter = {
      reporter: new DefaultFailureReporter(),
      recent: [],
    };
  }
  return globalStore.__bybeltFailureReporter;
}

/** Swap the active reporter (e.g. install a durable dead-letter reporter). */
export function setFailureReporter(reporter: FailureReporter): void {
  getState().reporter = reporter;
}

export function getFailureReporter(): FailureReporter {
  return getState().reporter;
}

/**
 * Report a failure with full correlation. Never throws — reporting a failure
 * must not create a new one. Returns the normalized record.
 */
export function reportFailure(report: FailureReport): NormalizedFailure {
  const state = getState();
  const ctx = getRequestContext();

  const category = report.category ?? classifyFailure(report.error);
  const retryable = report.retryable ?? isRetryableCategory(category);

  const normalized: NormalizedFailure = {
    message: describeFailure(report.error),
    component: report.component,
    jobName: report.jobName,
    jobId: report.jobId,
    category,
    retryable,
    recovery: report.recovery,
    attempts: report.attempts,
    requestId: report.requestId ?? ctx?.requestId,
    workspaceId: report.workspaceId ?? ctx?.workspaceId ?? null,
    conversationId: report.conversationId ?? ctx?.conversationId ?? null,
    deadLetterEligible: isDeadLetterEligible(report.recovery),
    finishedAt: new Date().toISOString(),
  };

  state.recent.push(normalized);
  if (state.recent.length > RECENT_BUFFER_SIZE) {
    state.recent.splice(0, state.recent.length - RECENT_BUFFER_SIZE);
  }

  try {
    state.reporter.report(normalized, report);
  } catch {
    // Reporting must never throw.
  }

  return normalized;
}

/** Recent reported failures (for health/diagnostics). */
export function recentFailures(limit = 20): NormalizedFailure[] {
  return getState().recent.slice(-limit);
}

/** Reset — test-only. */
export function resetFailureReporter(): void {
  globalStore.__bybeltFailureReporter = {
    reporter: new DefaultFailureReporter(),
    recent: [],
  };
}
