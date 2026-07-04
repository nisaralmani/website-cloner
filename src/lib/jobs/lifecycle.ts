/**
 * Process lifecycle token (Phase 24C, STEP 7).
 *
 * A single shared {@link CancellationToken} that graceful shutdown cancels. The
 * runner links every job to this token so a SIGTERM cooperatively cancels
 * in-flight work. Kept in its own module to avoid an import cycle between the
 * runner and the shutdown coordinator.
 */

import { CancellationToken } from "@/lib/jobs/cancellation";

const globalStore = globalThis as typeof globalThis & {
  __bybeltJobShutdownToken?: CancellationToken;
};

export function getShutdownToken(): CancellationToken {
  if (!globalStore.__bybeltJobShutdownToken) {
    globalStore.__bybeltJobShutdownToken = new CancellationToken();
  }
  return globalStore.__bybeltJobShutdownToken;
}

/** True once shutdown has cancelled the shared token. */
export function isShuttingDown(): boolean {
  return getShutdownToken().cancelled;
}

/** Reset the token — test-only helper. */
export function resetShutdownToken(): void {
  globalStore.__bybeltJobShutdownToken = new CancellationToken();
}
