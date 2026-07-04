/**
 * Phase 24D reliability runtime test.
 *
 * Self-contained (no DB): circuit breaker states, retry budget exhaustion,
 * recovery decisions, failure reporting, and runner integration (circuit +
 * budget). Run: npx tsx scripts/test-reliability.mts
 */
import assert from "node:assert";
import { runJob } from "@/lib/jobs";
import { JobError, JobFailureCategory } from "@/lib/jobs/failure";
import {
  withCircuitBreaker,
  circuitState,
  CircuitOpenError,
  resetCircuitBreakers,
} from "@/lib/reliability/circuit-breaker";
import {
  consumeRetryToken,
  hasRetryBudget,
  retryBudgetUsage,
  resetRetryBudgets,
} from "@/lib/reliability/retry-budget";
import { decideRecovery } from "@/lib/reliability/recovery";
import { reportFailure, recentFailures, resetFailureReporter } from "@/lib/reliability/failure-reporter";
import { getReliabilityHealth } from "@/lib/reliability/health";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}

async function fail(): Promise<never> {
  throw new JobError("boom", JobFailureCategory.Network);
}

async function main() {
  console.log("Phase 24D reliability tests\n");
  resetCircuitBreakers();
  resetRetryBudgets();
  resetFailureReporter();

  // 1. Circuit breaker: opens after threshold, short-circuits, recovers.
  const cfg = { failureThreshold: 3, recoveryTimeoutMs: 50, successThreshold: 1, halfOpenMaxCalls: 1 };
  for (let i = 0; i < 3; i += 1) {
    await withCircuitBreaker("svc", fail, cfg).catch(() => {});
  }
  assert(circuitState("svc") === "open", "breaker open after threshold");
  ok("breaker opens after the failure threshold");

  let shortCircuited = false;
  await withCircuitBreaker("svc", async () => "x", cfg).catch((e) => {
    shortCircuited = e instanceof CircuitOpenError;
  });
  assert(shortCircuited, "open breaker short-circuits");
  ok("open breaker short-circuits without calling fn");

  await new Promise((r) => setTimeout(r, 60)); // recovery window
  assert(circuitState("svc") === "half-open", "moves to half-open");
  const recovered = await withCircuitBreaker("svc", async () => "ok", cfg);
  assert(recovered === "ok" && circuitState("svc") === "closed", "closes on success");
  ok("breaker half-opens then closes on a successful trial");

  // 2. Retry budget: exhausts, denies, reports usage.
  for (let i = 0; i < 3; i += 1) {
    assert(consumeRetryToken("b", { capacity: 3, refillPerSec: 0 }), "token granted");
  }
  assert(!consumeRetryToken("b", { capacity: 3, refillPerSec: 0 }), "budget exhausted");
  assert(!hasRetryBudget("b"), "no budget left");
  const usage = retryBudgetUsage("b");
  assert(usage && usage.exhausted && usage.denied >= 1, "usage reflects exhaustion");
  ok("retry budget exhausts and reports usage");

  // 3. Recovery decisions.
  const d1 = decideRecovery({ error: new JobError("n", JobFailureCategory.Network), attempt: 1, policy: { maxAttempts: 3 } });
  assert(d1.action === "retry" && d1.shouldRetry, "network retries");
  const d2 = decideRecovery({ error: new JobError("v", JobFailureCategory.Validation), attempt: 1, policy: { maxAttempts: 3 } });
  assert(d2.action === "give-up" && d2.reason === "non-retryable", "validation gives up");
  const d3 = decideRecovery({ error: new JobError("n", JobFailureCategory.Network), attempt: 3, policy: { maxAttempts: 3 } });
  assert(d3.action === "dead-letter" && d3.reason === "attempts-exhausted", "attempts exhausted → dead-letter");
  const d4 = decideRecovery({ error: new CircuitOpenError("svc", 100), attempt: 1, policy: { maxAttempts: 3 } });
  assert(d4.action === "cooldown" && d4.cooldownMs === 100, "circuit open → cooldown");
  ok("recovery decisions cover retry / give-up / dead-letter / cooldown");

  // 4. Failure reporter captures correlation + recovery + dead-letter flag.
  const report = reportFailure({
    error: new JobError("terminal", JobFailureCategory.Network),
    component: "test",
    recovery: "dead-letter",
    workspaceId: "ws1",
  });
  assert(report.deadLetterEligible, "dead-letter eligible");
  assert(report.workspaceId === "ws1" && report.category === "network", "correlation captured");
  assert(recentFailures().some((f) => f.component === "test"), "recorded in recent");
  ok("failure reporter records correlation + dead-letter eligibility");

  // 5. Runner integration: circuit option fails fast when open.
  resetCircuitBreakers();
  for (let i = 0; i < 5; i += 1) {
    await runJob("test.circuit", fail, { circuit: "runnersvc" });
  }
  const openRun = await runJob("test.circuit", async () => "should-not-run", { circuit: "runnersvc" });
  assert(!openRun.ok && openRun.category === JobFailureCategory.CircuitOpen, "runner honors open circuit");
  assert(openRun.recovery === "cooldown", "circuit-open → cooldown recovery on result");
  ok("runJob short-circuits on an open breaker with cooldown recovery");

  // 6. Runner integration: retry budget stops retries across runs.
  resetRetryBudgets();
  let attempts = 0;
  const r = await runJob(
    "test.budget",
    () => { attempts += 1; throw new JobError("t", JobFailureCategory.Network); },
    { retry: { maxAttempts: 5, baseDelayMs: 1, maxDelayMs: 1 }, retryBudget: "bud", retryBudgetConfig: { capacity: 2, refillPerSec: 0 } },
  );
  assert(!r.ok, "job failed");
  assert(attempts <= 3, `budget capped retries (attempts=${attempts})`);
  assert(r.recovery === "dead-letter", "budget-exhausted → dead-letter");
  ok("runJob retry budget caps cross-run retries");

  // 7. Health reflects breaker + budget state.
  const health = getReliabilityHealth();
  assert(Array.isArray(health.circuitBreakers) && Array.isArray(health.retryBudgets), "health arrays");
  assert(health.status === "degraded" || health.status === "ok", "health status valid");
  ok("reliability health snapshot is well-formed");

  console.log(`\n${passed} assertions passed.`);
}

main().catch((error) => {
  console.error("\nTEST FAILED:", error);
  process.exit(1);
});
