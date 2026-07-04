/**
 * Job registry + lifecycle state (Phase 24C, STEP 7 + STEP 8).
 *
 * Tracks in-flight executions so graceful shutdown can drain them and the
 * health endpoint can report running/queued counts. Also owns the process-wide
 * "accepting" flag: once shutdown begins, new jobs are rejected (or run
 * immediately-cancelled, per the runner) instead of being started.
 *
 * globalThis-backed for HMR / cross-module sharing, matching 24A infra.
 */

import type { CancellationToken } from "@/lib/jobs/cancellation";

export type RunningJob = {
  jobName: string;
  jobId: string;
  attempt: number;
  startedAt: number;
  cancellation: CancellationToken;
  workspaceId?: string | null;
};

type RegistryState = {
  running: Map<string, RunningJob>;
  /** Count of jobs waiting on a concurrency slot (see runner queue). */
  queued: number;
  accepting: boolean;
};

const globalStore = globalThis as typeof globalThis & {
  __bybeltJobRegistry?: RegistryState;
};

function getState(): RegistryState {
  if (!globalStore.__bybeltJobRegistry) {
    globalStore.__bybeltJobRegistry = {
      running: new Map(),
      queued: 0,
      accepting: true,
    };
  }
  return globalStore.__bybeltJobRegistry;
}

export function isAcceptingJobs(): boolean {
  return getState().accepting;
}

export function stopAcceptingJobs(): void {
  getState().accepting = false;
}

export function resumeAcceptingJobs(): void {
  getState().accepting = true;
}

export function registerRunningJob(job: RunningJob): void {
  getState().running.set(job.jobId, job);
}

export function unregisterRunningJob(jobId: string): void {
  getState().running.delete(jobId);
}

export function incrementQueued(): void {
  getState().queued += 1;
}

export function decrementQueued(): void {
  const state = getState();
  state.queued = Math.max(0, state.queued - 1);
}

export function runningJobs(): RunningJob[] {
  return [...getState().running.values()];
}

export function runningJobCount(): number {
  return getState().running.size;
}

export function queuedJobCount(): number {
  return getState().queued;
}

/** Cancel every in-flight job with the given reason (graceful shutdown). */
export function cancelAllRunningJobs(reason: string): void {
  for (const job of getState().running.values()) {
    job.cancellation.cancel(reason);
  }
}
