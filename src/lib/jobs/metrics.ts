/**
 * Job metrics store (Phase 24C, STEP 6).
 *
 * In-process, provider-agnostic metrics: a bounded ring buffer of recent
 * executions plus per-job aggregates. Every finished execution is recorded once
 * by the runner and emitted as a structured log line. There is intentionally no
 * external metrics backend — this is the architecture/seam so a real exporter
 * (OTel/StatsD) can later read `snapshotJobMetrics()` without touching callers.
 *
 * State is stored on globalThis so Next.js HMR / multiple route modules share a
 * single instance (mirrors the redis-client + event-bus pattern in 24A).
 */

import { logger } from "@/lib/logging/logger";
import type { JobFailureCategory } from "@/lib/jobs/failure";
import type { JobExecutionRecord } from "@/lib/jobs/result";

const RING_BUFFER_SIZE = 200;

type JobAggregate = {
  jobName: string;
  total: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  totalDurationMs: number;
  lastDurationMs: number;
  lastOutcome: JobExecutionRecord["outcome"];
  lastFailureReason?: string;
  lastCategory?: JobFailureCategory;
  lastExecutionAt: string;
};

type MetricsState = {
  recent: JobExecutionRecord[];
  aggregates: Map<string, JobAggregate>;
};

const globalStore = globalThis as typeof globalThis & {
  __bybeltJobMetrics?: MetricsState;
};

function getState(): MetricsState {
  if (!globalStore.__bybeltJobMetrics) {
    globalStore.__bybeltJobMetrics = { recent: [], aggregates: new Map() };
  }
  return globalStore.__bybeltJobMetrics;
}

const metricsLog = logger;

/** Record one finished execution: update aggregates, ring buffer, emit a log. */
export function recordJobExecution(record: JobExecutionRecord): void {
  const state = getState();

  state.recent.push(record);
  if (state.recent.length > RING_BUFFER_SIZE) {
    state.recent.splice(0, state.recent.length - RING_BUFFER_SIZE);
  }

  const existing = state.aggregates.get(record.jobName);
  const aggregate: JobAggregate = existing ?? {
    jobName: record.jobName,
    total: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
    totalDurationMs: 0,
    lastDurationMs: 0,
    lastOutcome: record.outcome,
    lastExecutionAt: record.finishedAt,
  };

  aggregate.total += 1;
  if (record.outcome === "success") aggregate.succeeded += 1;
  else if (record.outcome === "cancelled") aggregate.cancelled += 1;
  else aggregate.failed += 1;
  aggregate.totalDurationMs += record.durationMs;
  aggregate.lastDurationMs = record.durationMs;
  aggregate.lastOutcome = record.outcome;
  aggregate.lastFailureReason = record.failureReason;
  aggregate.lastCategory = record.category;
  aggregate.lastExecutionAt = record.finishedAt;
  state.aggregates.set(record.jobName, aggregate);

  // STEP 6: every job emits jobName/duration/attempt/success/failureReason +
  // correlation fields. Level reflects outcome.
  const level = record.outcome === "success" ? "info" : "warn";
  metricsLog[level]("job_metric", {
    event: "job_metric",
    component: "jobs",
    jobName: record.jobName,
    jobId: record.jobId,
    outcome: record.outcome,
    success: record.success,
    attempt: record.attempts,
    durationMs: record.durationMs,
    failureReason: record.failureReason,
    category: record.category,
    requestId: record.requestId,
    workspaceId: record.workspaceId ?? undefined,
    conversationId: record.conversationId ?? undefined,
  });
}

export type JobMetricsSnapshot = {
  totals: {
    executions: number;
    succeeded: number;
    failed: number;
    cancelled: number;
  };
  perJob: Array<
    JobAggregate & {
      avgDurationMs: number;
      failureRate: number;
    }
  >;
  recentFailures: JobExecutionRecord[];
  lastExecutionAt: string | null;
};

/** Point-in-time metrics snapshot for health/diagnostics. */
export function snapshotJobMetrics(): JobMetricsSnapshot {
  const state = getState();

  let executions = 0;
  let succeeded = 0;
  let failed = 0;
  let cancelled = 0;
  let lastExecutionAt: string | null = null;

  const perJob = [...state.aggregates.values()].map((aggregate) => {
    executions += aggregate.total;
    succeeded += aggregate.succeeded;
    failed += aggregate.failed;
    cancelled += aggregate.cancelled;
    if (!lastExecutionAt || aggregate.lastExecutionAt > lastExecutionAt) {
      lastExecutionAt = aggregate.lastExecutionAt;
    }
    return {
      ...aggregate,
      avgDurationMs:
        aggregate.total > 0 ? Math.round(aggregate.totalDurationMs / aggregate.total) : 0,
      failureRate: aggregate.total > 0 ? aggregate.failed / aggregate.total : 0,
    };
  });

  const recentFailures = state.recent
    .filter((record) => record.outcome !== "success")
    .slice(-20);

  return {
    totals: { executions, succeeded, failed, cancelled },
    perJob,
    recentFailures,
    lastExecutionAt,
  };
}

/** Reset all metrics — test-only helper. */
export function resetJobMetrics(): void {
  globalStore.__bybeltJobMetrics = { recent: [], aggregates: new Map() };
}
