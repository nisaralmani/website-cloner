/**
 * Retry budget (Phase 24D, STEP 4).
 *
 * Per-attempt `maxAttempts` (Phase 24C) caps retries *within a single run*. A
 * retry budget caps retries *across runs* over a rolling window, so a
 * persistently-failing dependency cannot drive unbounded retry volume (a
 * retry storm) even though each individual run is bounded.
 *
 * Model: a token bucket per named key. Each retry consumes one token; tokens
 * refill continuously at `refillPerSec`. When the bucket is empty the budget is
 * exhausted and the runner stops retrying (recovery escalates to cooldown /
 * give-up). Usage is exposed for health. In-memory + globalThis-backed, matching
 * the 24A/24C infra pattern. No external libraries.
 */

export type RetryBudgetConfig = {
  /** Bucket capacity — max retries available in a burst. */
  capacity: number;
  /** Continuous refill rate in tokens/second. */
  refillPerSec: number;
};

export const DEFAULT_RETRY_BUDGET: RetryBudgetConfig = {
  capacity: 30,
  refillPerSec: 1,
};

type Bucket = {
  name: string;
  config: RetryBudgetConfig;
  tokens: number;
  updatedAt: number;
  consumed: number;
  denied: number;
};

type BudgetState = {
  buckets: Map<string, Bucket>;
};

const globalStore = globalThis as typeof globalThis & {
  __bybeltRetryBudgets?: BudgetState;
};

function getState(): BudgetState {
  if (!globalStore.__bybeltRetryBudgets) {
    globalStore.__bybeltRetryBudgets = { buckets: new Map() };
  }
  return globalStore.__bybeltRetryBudgets;
}

function now(): number {
  return Date.now();
}

function refill(bucket: Bucket): void {
  const elapsedMs = now() - bucket.updatedAt;
  if (elapsedMs <= 0) return;
  const refilled = (elapsedMs / 1000) * bucket.config.refillPerSec;
  bucket.tokens = Math.min(bucket.config.capacity, bucket.tokens + refilled);
  bucket.updatedAt = now();
}

function getBucket(name: string, config?: Partial<RetryBudgetConfig>): Bucket {
  const state = getState();
  let bucket = state.buckets.get(name);
  if (!bucket) {
    const resolved = { ...DEFAULT_RETRY_BUDGET, ...config };
    bucket = {
      name,
      config: resolved,
      tokens: resolved.capacity,
      updatedAt: now(),
      consumed: 0,
      denied: 0,
    };
    state.buckets.set(name, bucket);
  } else if (config) {
    bucket.config = { ...bucket.config, ...config };
  }
  return bucket;
}

/**
 * Attempt to consume one retry token from the named budget.
 * Returns true if a retry is permitted (a token was consumed).
 */
export function consumeRetryToken(
  name: string,
  config?: Partial<RetryBudgetConfig>,
): boolean {
  const bucket = getBucket(name, config);
  refill(bucket);
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    bucket.consumed += 1;
    return true;
  }
  bucket.denied += 1;
  return false;
}

/** Pre-register / reconfigure a named budget without consuming a token. */
export function configureRetryBudget(
  name: string,
  config: Partial<RetryBudgetConfig>,
): void {
  getBucket(name, config);
}

/** Whether the named budget currently has a token available (no consume). */
export function hasRetryBudget(name: string): boolean {
  const state = getState();
  const bucket = state.buckets.get(name);
  if (!bucket) return true;
  refill(bucket);
  return bucket.tokens >= 1;
}

export type RetryBudgetUsage = {
  name: string;
  capacity: number;
  available: number;
  usedFraction: number;
  consumed: number;
  denied: number;
  exhausted: boolean;
};

function usageOf(bucket: Bucket): RetryBudgetUsage {
  refill(bucket);
  const available = Math.floor(bucket.tokens);
  return {
    name: bucket.name,
    capacity: bucket.config.capacity,
    available,
    usedFraction: 1 - bucket.tokens / bucket.config.capacity,
    consumed: bucket.consumed,
    denied: bucket.denied,
    exhausted: bucket.tokens < 1,
  };
}

export function retryBudgetUsage(name: string): RetryBudgetUsage | null {
  const bucket = getState().buckets.get(name);
  return bucket ? usageOf(bucket) : null;
}

export function allRetryBudgetUsage(): RetryBudgetUsage[] {
  return [...getState().buckets.values()].map(usageOf);
}

/** Reset — test-only. */
export function resetRetryBudgets(): void {
  globalStore.__bybeltRetryBudgets = { buckets: new Map() };
}
