/**
 * Recovery framework (Phase 24D, STEP 2).
 *
 * One place that answers "a job attempt failed — now what?". It composes the
 * existing failure classification (24C) with the retry budget (STEP 4) and
 * circuit-breaker state (STEP 3) into a single {@link RecoveryDecision}. The
 * runner consults this instead of hand-rolling retry/cooldown logic, so there
 * is no duplicated recovery logic anywhere.
 *
 * Pure and side-effect-free except for the retry-token consume (which is the
 * whole point of a budget check). Never throws.
 */

import {
  classifyFailure,
  isRetryableCategory,
  JobFailureCategory,
} from "@/lib/jobs/failure";
import { CircuitOpenError } from "@/lib/reliability/circuit-breaker";
import {
  consumeRetryToken,
  hasRetryBudget,
  type RetryBudgetConfig,
} from "@/lib/reliability/retry-budget";

/** What the runner should do next. */
export type RecoveryAction = "retry" | "cooldown" | "dead-letter" | "give-up";

/** Why that action was chosen. */
export type RecoveryReason =
  | "retryable"
  | "non-retryable"
  | "attempts-exhausted"
  | "budget-exhausted"
  | "circuit-open"
  | "cancelled";

export type RecoveryPolicy = {
  /** Total attempts permitted in this run (mirrors the retry policy). */
  maxAttempts: number;
  /** Named retry budget consulted before granting a retry (STEP 4). */
  budgetName?: string;
  budgetConfig?: Partial<RetryBudgetConfig>;
  /**
   * Whether an exhausted retry (budget or attempts) is dead-letter eligible.
   * Defaults to true so a durable DLQ (STEP 6) can later capture it.
   */
  deadLetterOnExhaustion?: boolean;
  /**
   * Optional per-caller override mirroring `RetryPolicy.shouldRetry`. When it
   * vetoes a retry, recovery is terminal (`give-up`) and no budget is consumed.
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

export type RecoveryContext = {
  error: unknown;
  attempt: number;
  policy: RecoveryPolicy;
  /** True if the run's cancellation token is already cancelled. */
  cancelled?: boolean;
};

export type RecoveryDecision = {
  action: RecoveryAction;
  reason: RecoveryReason;
  category: JobFailureCategory;
  retryable: boolean;
  /** True when the runner should retry the attempt. */
  shouldRetry: boolean;
  /** Suggested cooldown (ms) before the dependency is retried out-of-band. */
  cooldownMs?: number;
};

/**
 * Decide how to recover from a failed attempt. When the decision is `retry` and
 * a budget is configured, a retry token is consumed as part of this call.
 */
export function decideRecovery(ctx: RecoveryContext): RecoveryDecision {
  const category = classifyFailure(ctx.error);
  const retryable = isRetryableCategory(category);
  const deadLetter = ctx.policy.deadLetterOnExhaustion ?? true;

  // Cancellation is terminal — never retry, never dead-letter.
  if (ctx.cancelled || category === JobFailureCategory.Cancelled) {
    return { action: "give-up", reason: "cancelled", category, retryable: false, shouldRetry: false };
  }

  // An open circuit means the dependency is known-bad: cool down, don't hammer.
  if (category === JobFailureCategory.CircuitOpen) {
    const cooldownMs =
      ctx.error instanceof CircuitOpenError ? ctx.error.retryAfterMs : undefined;
    return {
      action: "cooldown",
      reason: "circuit-open",
      category,
      retryable: false,
      shouldRetry: false,
      cooldownMs,
    };
  }

  // Deterministic failures are terminal.
  if (!retryable) {
    return { action: "give-up", reason: "non-retryable", category, retryable: false, shouldRetry: false };
  }

  // Caller-supplied veto (mirrors RetryPolicy.shouldRetry) — terminal, no budget spent.
  if (ctx.policy.shouldRetry && !ctx.policy.shouldRetry(ctx.error, ctx.attempt)) {
    return { action: "give-up", reason: "non-retryable", category, retryable: true, shouldRetry: false };
  }

  // Per-run attempt budget.
  if (ctx.attempt >= ctx.policy.maxAttempts) {
    return {
      action: deadLetter ? "dead-letter" : "give-up",
      reason: "attempts-exhausted",
      category,
      retryable: true,
      shouldRetry: false,
    };
  }

  // Cross-run retry budget (STEP 4). Peek first, then consume when granting.
  if (ctx.policy.budgetName) {
    if (!hasRetryBudget(ctx.policy.budgetName)) {
      return {
        action: deadLetter ? "dead-letter" : "give-up",
        reason: "budget-exhausted",
        category,
        retryable: true,
        shouldRetry: false,
      };
    }
    const granted = consumeRetryToken(ctx.policy.budgetName, ctx.policy.budgetConfig);
    if (!granted) {
      return {
        action: deadLetter ? "dead-letter" : "give-up",
        reason: "budget-exhausted",
        category,
        retryable: true,
        shouldRetry: false,
      };
    }
  }

  return { action: "retry", reason: "retryable", category, retryable: true, shouldRetry: true };
}

/** Map a recovery action to the failure-reporter's decision-kind vocabulary. */
export function recoveryDecisionKind(action: RecoveryAction): RecoveryAction {
  return action;
}
