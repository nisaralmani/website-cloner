/**
 * Job scheduler (Phase 24C, STEP 2).
 *
 * In-process interval scheduler for recurring jobs (e.g. a self-driving poll
 * loop as an alternative to an external cron hitting a route). Each tick runs
 * through {@link runJob}, so it inherits timeout/retry/metrics/cancellation and
 * participates in graceful shutdown. Ticks never overlap: a slow run defers the
 * next tick rather than stacking.
 *
 * This is an opt-in primitive — nothing schedules itself by importing this. The
 * existing cron routes remain the trigger of record; this exists so future jobs
 * have a first-class, shutdown-aware scheduling option instead of a raw
 * `setInterval`.
 */

import type { JobFn } from "@/lib/jobs/context";
import { getShutdownToken } from "@/lib/jobs/lifecycle";
import { createComponentLogger } from "@/lib/logging/logger";
import { runJob, type RunJobOptions } from "@/lib/jobs/runner";

export type ScheduleOptions = RunJobOptions & {
  /** Interval between ticks, in ms. */
  intervalMs: number;
  /** Delay before the first tick (default 0). */
  initialDelayMs?: number;
  /** Random +/- jitter fraction applied to each interval (0..1, default 0.1). */
  jitterFraction?: number;
};

export type ScheduledJob = {
  readonly jobName: string;
  stop: () => void;
  readonly running: boolean;
};

const log = createComponentLogger("job-scheduler");

const globalStore = globalThis as typeof globalThis & {
  __bybeltScheduledJobs?: Map<string, ScheduledJob>;
};

function registry(): Map<string, ScheduledJob> {
  if (!globalStore.__bybeltScheduledJobs) {
    globalStore.__bybeltScheduledJobs = new Map();
  }
  return globalStore.__bybeltScheduledJobs;
}

function jitter(intervalMs: number, fraction: number): number {
  const clamped = Math.max(0, Math.min(1, fraction));
  const delta = intervalMs * clamped;
  return Math.round(intervalMs - delta + Math.random() * (2 * delta));
}

/**
 * Schedule `fn` to run every `intervalMs`. Returns a handle to stop it.
 * Re-scheduling the same `jobName` replaces the prior schedule.
 */
export function scheduleJob<T>(
  jobName: string,
  fn: JobFn<T>,
  options: ScheduleOptions,
): ScheduledJob {
  const existing = registry().get(jobName);
  if (existing) existing.stop();

  const { intervalMs, initialDelayMs = 0, jitterFraction = 0.1, ...runOptions } = options;

  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const shutdown = getShutdownToken();

  const handle: ScheduledJob = {
    jobName,
    running: true,
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      registry().delete(jobName);
      log.info("scheduler_stopped", { jobName });
    },
  };

  const tick = async () => {
    if (stopped || shutdown.cancelled) {
      handle.stop();
      return;
    }
    await runJob(jobName, fn, runOptions);
    if (stopped || shutdown.cancelled) {
      handle.stop();
      return;
    }
    timer = setTimeout(() => void tick(), jitter(intervalMs, jitterFraction));
  };

  shutdown.onCancelled(() => handle.stop());
  timer = setTimeout(() => void tick(), initialDelayMs);
  registry().set(jobName, handle);
  log.info("scheduler_started", { jobName, intervalMs });
  return handle;
}

/** Stop every scheduled job (used during graceful shutdown). */
export function stopAllScheduledJobs(): void {
  for (const job of [...registry().values()]) {
    job.stop();
  }
}

export function listScheduledJobs(): string[] {
  return [...registry().keys()];
}
