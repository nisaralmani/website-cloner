/**
 * Phase 24C job-framework runtime test.
 *
 * Self-contained (no DB): exercises success, retry + classification, timeout,
 * cancellation, idempotency dedup, metrics, and graceful-shutdown rejection.
 * Run: npx tsx scripts/test-jobs.mts
 */
import assert from "node:assert";
import {
  runJob,
  JobError,
  JobFailureCategory,
  classifyFailure,
  backoffDelayMs,
  DEFAULT_RETRY_POLICY,
  snapshotJobMetrics,
  drainJobs,
  isAcceptingJobs,
} from "@/lib/jobs";
import { HttpClientError } from "@/lib/http/client";
import { resetShutdownToken } from "@/lib/jobs/lifecycle";
import { resumeAcceptingJobs } from "@/lib/jobs/registry";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}

async function main() {
  console.log("Phase 24C job-framework tests\n");

  // 1. Success path returns typed value.
  const r1 = await runJob("test.success", () => 42);
  assert(r1.ok && r1.value === 42 && r1.attempts === 1, "success value");
  ok("runs a job and returns the value");

  // 2. Failure never throws; returns classified failure.
  const r2 = await runJob("test.fail", () => {
    throw new JobError("nope", JobFailureCategory.Validation);
  });
  assert(!r2.ok, "should be failure");
  assert(r2.category === JobFailureCategory.Validation, "validation category");
  assert(r2.attempts === 1, "validation is not retried");
  ok("failure is classified and never throws");

  // 3. Retry: a retryable error retries up to maxAttempts.
  let tries = 0;
  const r3 = await runJob(
    "test.retry",
    () => {
      tries += 1;
      throw new JobError("transient", JobFailureCategory.Network);
    },
    { retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 2 } },
  );
  assert(!r3.ok && r3.attempts === 3 && tries === 3, "retried 3 times");
  ok("retryable failure retries to the attempt budget");

  // 4. Retry recovers on a later attempt.
  let n = 0;
  const r4 = await runJob(
    "test.recover",
    () => {
      n += 1;
      if (n < 2) throw new JobError("again", JobFailureCategory.Timeout);
      return "recovered";
    },
    { retry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 2 } },
  );
  assert(r4.ok && r4.value === "recovered" && r4.attempts === 2, "recovered");
  ok("retry recovers when a later attempt succeeds");

  // 5. Timeout classification.
  const r5 = await runJob(
    "test.timeout",
    (ctx) => new Promise((resolve) => {
      const t = setTimeout(resolve, 1000);
      ctx.signal.addEventListener("abort", () => clearTimeout(t));
    }),
    { timeoutMs: 20 },
  );
  assert(!r5.ok && r5.category === JobFailureCategory.Timeout, "timed out");
  ok("per-attempt timeout produces a Timeout failure");

  // 6. HttpClientError classification reuse.
  const httpErr = new HttpClientError("429", {
    kind: "http",
    url: "x",
    durationMs: 1,
    status: 429,
  });
  assert(classifyFailure(httpErr) === JobFailureCategory.RateLimited, "429 → rate_limited");
  const authErr = new HttpClientError("403", {
    kind: "http",
    url: "x",
    durationMs: 1,
    status: 403,
  });
  assert(classifyFailure(authErr) === JobFailureCategory.Authentication, "403 → auth");
  ok("reuses HttpClientError taxonomy for classification");

  // 7. Idempotency dedup short-circuits.
  let ran = 0;
  const seen = new Set<string>(["already-done"]);
  const r7 = await runJob(
    "test.idem",
    () => { ran += 1; return "work"; },
    { idempotency: { key: "already-done", isDuplicate: (k) => seen.has(k) } },
  );
  assert(r7.ok && r7.deduped === true && ran === 0, "deduped, no work");
  ok("idempotency hook skips duplicate work");

  // 8. markProcessed runs after a fresh success.
  const store = new Set<string>();
  const r8 = await runJob(
    "test.idem2",
    () => "fresh",
    {
      idempotency: {
        key: "k1",
        isDuplicate: (k) => store.has(k),
        markProcessed: (k) => { store.add(k); },
      },
    },
  );
  assert(r8.ok && store.has("k1"), "marked processed");
  ok("idempotency marks the key processed after success");

  // 9. Backoff jitter stays within bounds.
  for (let a = 1; a <= 6; a += 1) {
    const d = backoffDelayMs({ ...DEFAULT_RETRY_POLICY, jitter: "full" }, a, () => 1);
    assert(d <= DEFAULT_RETRY_POLICY.maxDelayMs, "capped");
  }
  ok("backoff respects the max-delay cap");

  // 10. Metrics captured every execution.
  const snap = snapshotJobMetrics();
  assert(snap.totals.executions >= 7, "executions recorded");
  assert(snap.totals.failed >= 3 && snap.totals.succeeded >= 3, "counts split");
  ok("metrics record every execution");

  // 11. Graceful shutdown rejects new jobs, then resume for cleanliness.
  await drainJobs("test");
  assert(!isAcceptingJobs(), "not accepting during drain");
  const r11 = await runJob("test.after-shutdown", () => "x");
  assert(!r11.ok && r11.category === JobFailureCategory.Cancelled, "rejected on shutdown");
  ok("shutdown drain rejects new jobs");

  resumeAcceptingJobs();
  resetShutdownToken();

  console.log(`\n${passed} assertions passed.`);
}

main().catch((error) => {
  console.error("\nTEST FAILED:", error);
  process.exit(1);
});
