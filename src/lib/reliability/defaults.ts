/**
 * Reliability defaults (Phase 24D).
 *
 * Pre-registers the named circuit breakers for the platform's unstable external
 * dependencies so their state is visible in /api/health from boot (before the
 * first call trips them), and configures the shared retry budgets. Called once
 * from the instrumentation hook. Pure configuration — no calls are made here.
 */

import { CIRCUITS, configureCircuitBreaker } from "@/lib/reliability/circuit-breaker";
import { configureRetryBudget } from "@/lib/reliability/retry-budget";

let registered = false;

export function registerReliabilityDefaults(): void {
  if (registered) return;
  registered = true;

  // External services: trip after sustained failure, recover on a timer.
  configureCircuitBreaker(CIRCUITS.shopify, {
    failureThreshold: 5,
    recoveryTimeoutMs: 30_000,
    successThreshold: 2,
  });
  configureCircuitBreaker(CIRCUITS.openai, {
    failureThreshold: 5,
    recoveryTimeoutMs: 20_000,
    successThreshold: 2,
  });
  configureCircuitBreaker(CIRCUITS.email, {
    failureThreshold: 4,
    recoveryTimeoutMs: 30_000,
    successThreshold: 2,
  });
  configureCircuitBreaker(CIRCUITS.bridge, {
    failureThreshold: 5,
    recoveryTimeoutMs: 15_000,
    successThreshold: 2,
  });

  // Shared retry budgets bound cross-run retry volume per dependency class.
  configureRetryBudget(CIRCUITS.shopify, { capacity: 30, refillPerSec: 1 });
  configureRetryBudget(CIRCUITS.openai, { capacity: 20, refillPerSec: 1 });
  configureRetryBudget(CIRCUITS.email, { capacity: 20, refillPerSec: 0.5 });
  configureRetryBudget(CIRCUITS.bridge, { capacity: 40, refillPerSec: 2 });
}
