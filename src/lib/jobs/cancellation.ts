/**
 * Cancellation tokens (Phase 24C, STEP 3).
 *
 * A thin, dependency-free wrapper over the platform `AbortController` so job
 * code has one idiom for cooperative cancellation: check `token.cancelled`,
 * pass `token.signal` to `fetch`/timers, or `throwIfCancelled()` at safe points.
 * Graceful shutdown (STEP 7) cancels the shared shutdown token to drain work.
 */

import { JobCancelledError } from "@/lib/jobs/failure";

export type CancellationReason = "shutdown" | "timeout" | "manual" | string;

export class CancellationToken {
  private readonly controller: AbortController;
  private reasonText: CancellationReason | null = null;

  constructor(signal?: AbortSignal) {
    this.controller = new AbortController();
    if (signal) {
      if (signal.aborted) {
        this.cancel("manual");
      } else {
        signal.addEventListener("abort", () => this.cancel("manual"), { once: true });
      }
    }
  }

  /** The underlying signal — pass to `fetch`, `setTimeout` guards, etc. */
  get signal(): AbortSignal {
    return this.controller.signal;
  }

  get cancelled(): boolean {
    return this.controller.signal.aborted;
  }

  get reason(): CancellationReason | null {
    return this.reasonText;
  }

  cancel(reason: CancellationReason = "manual"): void {
    if (this.controller.signal.aborted) return;
    this.reasonText = reason;
    this.controller.abort();
  }

  /** Register a callback fired once when cancellation occurs. */
  onCancelled(callback: () => void): () => void {
    if (this.controller.signal.aborted) {
      callback();
      return () => {};
    }
    const handler = () => callback();
    this.controller.signal.addEventListener("abort", handler, { once: true });
    return () => this.controller.signal.removeEventListener("abort", handler);
  }

  /** Throw a {@link JobCancelledError} if cancellation has been requested. */
  throwIfCancelled(): void {
    if (this.controller.signal.aborted) {
      throw new JobCancelledError(
        this.reasonText ? `Job cancelled (${this.reasonText})` : "Job cancelled",
      );
    }
  }
}

/** A token that is never cancelled — used when no cancellation source exists. */
export function neverCancelled(): CancellationToken {
  return new CancellationToken();
}

/**
 * Combine multiple signals/tokens into one token that cancels when any source
 * cancels (e.g. per-job timeout + global shutdown).
 */
export function linkCancellation(
  sources: Array<CancellationToken | AbortSignal | undefined>,
): CancellationToken {
  const token = new CancellationToken();
  for (const source of sources) {
    if (!source) continue;
    const signal = source instanceof CancellationToken ? source.signal : source;
    if (signal.aborted) {
      token.cancel("manual");
      break;
    }
    signal.addEventListener("abort", () => token.cancel("manual"), { once: true });
  }
  return token;
}
