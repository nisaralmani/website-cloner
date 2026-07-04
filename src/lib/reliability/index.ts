/**
 * Production reliability, recovery & resilience (Phase 24D).
 *
 * Public surface. Built on top of the Phase 24C job framework:
 *   - {@link reportFailure}    — structured, correlated failure visibility (STEP 5)
 *   - {@link decideRecovery}   — one recovery decision engine (STEP 2)
 *   - {@link withCircuitBreaker} — breakers for unstable dependencies (STEP 3)
 *   - retry budgets            — bound cross-run retry volume (STEP 4)
 *   - {@link getReliabilityHealth} — health integration (STEP 7)
 *
 * See docs/observability/reliability.md for lifecycles + extension points.
 */

export {
  reportFailure,
  recentFailures,
  setFailureReporter,
  getFailureReporter,
  type FailureReport,
  type FailureReporter,
  type NormalizedFailure,
  type RecoveryDecisionKind,
} from "@/lib/reliability/failure-reporter";

export {
  decideRecovery,
  recoveryDecisionKind,
  type RecoveryPolicy,
  type RecoveryContext,
  type RecoveryDecision,
  type RecoveryAction,
  type RecoveryReason,
} from "@/lib/reliability/recovery";

export {
  withCircuitBreaker,
  configureCircuitBreaker,
  circuitState,
  circuitBreakerSnapshot,
  allCircuitBreakerSnapshots,
  CircuitOpenError,
  CIRCUITS,
  DEFAULT_CIRCUIT_CONFIG,
  type CircuitName,
  type CircuitState,
  type CircuitBreakerConfig,
  type CircuitBreakerSnapshot,
} from "@/lib/reliability/circuit-breaker";

export {
  consumeRetryToken,
  hasRetryBudget,
  retryBudgetUsage,
  allRetryBudgetUsage,
  configureRetryBudget,
  DEFAULT_RETRY_BUDGET,
  type RetryBudgetConfig,
  type RetryBudgetUsage,
} from "@/lib/reliability/retry-budget";

export {
  getReliabilityHealth,
  type ReliabilityHealth,
} from "@/lib/reliability/health";
