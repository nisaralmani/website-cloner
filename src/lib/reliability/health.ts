/**
 * Reliability health snapshot (Phase 24D, STEP 7).
 *
 * Read-only view of circuit-breaker state, retry-budget usage, degraded
 * dependencies, and recent reported failures — folded into the EXISTING
 * /api/health response via `checkJobs()` in `@/lib/health/checks`. No new
 * endpoint is created. Never throws.
 */

import {
  allCircuitBreakerSnapshots,
  type CircuitBreakerSnapshot,
} from "@/lib/reliability/circuit-breaker";
import {
  recentFailures,
  type NormalizedFailure,
} from "@/lib/reliability/failure-reporter";
import {
  allRetryBudgetUsage,
  type RetryBudgetUsage,
} from "@/lib/reliability/retry-budget";

export type ReliabilityHealth = {
  status: "ok" | "degraded";
  /** Dependencies whose breaker is open or half-open. */
  degradedDependencies: string[];
  circuitBreakers: CircuitBreakerSnapshot[];
  retryBudgets: RetryBudgetUsage[];
  recentFailures: Array<{
    component: string;
    jobName?: string;
    category: string;
    recovery?: string;
    retryable: boolean;
  }>;
};

/**
 * Degraded when any breaker is not `closed` or any retry budget is exhausted.
 * Never throws.
 */
export function getReliabilityHealth(): ReliabilityHealth {
  const circuitBreakers = allCircuitBreakerSnapshots();
  const retryBudgets = allRetryBudgetUsage();

  const degradedDependencies = circuitBreakers
    .filter((breaker) => breaker.state !== "closed")
    .map((breaker) => breaker.name);

  const budgetExhausted = retryBudgets.some((budget) => budget.exhausted);

  const status: ReliabilityHealth["status"] =
    degradedDependencies.length > 0 || budgetExhausted ? "degraded" : "ok";

  return {
    status,
    degradedDependencies,
    circuitBreakers,
    retryBudgets,
    recentFailures: recentFailures(10).map((failure: NormalizedFailure) => ({
      component: failure.component,
      jobName: failure.jobName,
      category: failure.category,
      recovery: failure.recovery,
      retryable: failure.retryable,
    })),
  };
}
