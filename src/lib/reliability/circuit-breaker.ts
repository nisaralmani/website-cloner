/**
 * Circuit breaker (Phase 24D, STEP 3).
 *
 * A lightweight, dependency-free breaker for unstable external services
 * (Shopify, OpenAI, email providers, the internal bridge). Three states:
 *
 *   closed    → calls flow; consecutive failures are counted.
 *   open      → calls are short-circuited with {@link CircuitOpenError} until
 *               `recoveryTimeoutMs` elapses, then → half-open.
 *   half-open → a limited number of trial calls are allowed; enough successes
 *               close the breaker, any failure re-opens it.
 *
 * Breakers are named and shared via globalThis (matching 24A/24C infra). No
 * external libraries. Integrates with the job runner via `runJob({ circuit })`
 * and can wrap any async call directly via {@link withCircuitBreaker}.
 */

import { JobError, JobFailureCategory } from "@/lib/jobs/failure";

export type CircuitState = "closed" | "open" | "half-open";

export type CircuitBreakerConfig = {
  /** Consecutive failures in `closed` that trip the breaker to `open`. */
  failureThreshold: number;
  /** Time the breaker stays `open` before allowing half-open trials. */
  recoveryTimeoutMs: number;
  /** Successful half-open trials required to close the breaker. */
  successThreshold: number;
  /** Max concurrent trial calls permitted while half-open. */
  halfOpenMaxCalls: number;
};

export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeoutMs: 30_000,
  successThreshold: 2,
  halfOpenMaxCalls: 1,
};

/** Thrown when a breaker is open. Classified as `circuit_open` (non-retryable). */
export class CircuitOpenError extends JobError {
  readonly circuit: string;
  readonly retryAfterMs: number;

  constructor(circuit: string, retryAfterMs: number) {
    super(`Circuit "${circuit}" is open`, JobFailureCategory.CircuitOpen, {
      retryable: false,
    });
    this.name = "CircuitOpenError";
    this.circuit = circuit;
    this.retryAfterMs = retryAfterMs;
  }
}

type BreakerRuntime = {
  name: string;
  config: CircuitBreakerConfig;
  state: CircuitState;
  consecutiveFailures: number;
  halfOpenSuccesses: number;
  halfOpenInFlight: number;
  openedAt: number | null;
  lastFailureAt: number | null;
  lastStateChangeAt: number;
  totalFailures: number;
  totalSuccesses: number;
  totalShortCircuited: number;
};

type BreakerState = {
  breakers: Map<string, BreakerRuntime>;
};

const globalStore = globalThis as typeof globalThis & {
  __bybeltCircuitBreakers?: BreakerState;
};

function getState(): BreakerState {
  if (!globalStore.__bybeltCircuitBreakers) {
    globalStore.__bybeltCircuitBreakers = { breakers: new Map() };
  }
  return globalStore.__bybeltCircuitBreakers;
}

function now(): number {
  return Date.now();
}

function getBreaker(
  name: string,
  config?: Partial<CircuitBreakerConfig>,
): BreakerRuntime {
  const state = getState();
  let breaker = state.breakers.get(name);
  if (!breaker) {
    breaker = {
      name,
      config: { ...DEFAULT_CIRCUIT_CONFIG, ...config },
      state: "closed",
      consecutiveFailures: 0,
      halfOpenSuccesses: 0,
      halfOpenInFlight: 0,
      openedAt: null,
      lastFailureAt: null,
      lastStateChangeAt: now(),
      totalFailures: 0,
      totalSuccesses: 0,
      totalShortCircuited: 0,
    };
    state.breakers.set(name, breaker);
  } else if (config) {
    breaker.config = { ...breaker.config, ...config };
  }
  return breaker;
}

function transition(breaker: BreakerRuntime, next: CircuitState): void {
  if (breaker.state === next) return;
  breaker.state = next;
  breaker.lastStateChangeAt = now();
  if (next === "open") {
    breaker.openedAt = now();
  } else if (next === "closed") {
    breaker.consecutiveFailures = 0;
    breaker.halfOpenSuccesses = 0;
    breaker.halfOpenInFlight = 0;
    breaker.openedAt = null;
  } else if (next === "half-open") {
    breaker.halfOpenSuccesses = 0;
    breaker.halfOpenInFlight = 0;
  }
}

/** Advance an open breaker to half-open once its recovery window has elapsed. */
function refreshState(breaker: BreakerRuntime): void {
  if (
    breaker.state === "open" &&
    breaker.openedAt !== null &&
    now() - breaker.openedAt >= breaker.config.recoveryTimeoutMs
  ) {
    transition(breaker, "half-open");
  }
}

/** Configure (or pre-register) a named breaker without executing a call. */
export function configureCircuitBreaker(
  name: string,
  config: Partial<CircuitBreakerConfig>,
): void {
  getBreaker(name, config);
}

export function circuitState(name: string): CircuitState {
  const breaker = getState().breakers.get(name);
  if (!breaker) return "closed";
  refreshState(breaker);
  return breaker.state;
}

function onSuccess(breaker: BreakerRuntime): void {
  breaker.totalSuccesses += 1;
  if (breaker.state === "half-open") {
    breaker.halfOpenSuccesses += 1;
    breaker.halfOpenInFlight = Math.max(0, breaker.halfOpenInFlight - 1);
    if (breaker.halfOpenSuccesses >= breaker.config.successThreshold) {
      transition(breaker, "closed");
    }
  } else {
    breaker.consecutiveFailures = 0;
  }
}

function onFailure(breaker: BreakerRuntime): void {
  breaker.totalFailures += 1;
  breaker.lastFailureAt = now();
  if (breaker.state === "half-open") {
    breaker.halfOpenInFlight = Math.max(0, breaker.halfOpenInFlight - 1);
    transition(breaker, "open");
    return;
  }
  breaker.consecutiveFailures += 1;
  if (breaker.consecutiveFailures >= breaker.config.failureThreshold) {
    transition(breaker, "open");
  }
}

/**
 * Execute `fn` guarded by the named breaker. Throws {@link CircuitOpenError}
 * without calling `fn` when the breaker is open (or half-open at capacity).
 * A thrown error from `fn` counts as a failure; a return counts as a success.
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>,
): Promise<T> {
  const breaker = getBreaker(name, config);
  refreshState(breaker);

  if (breaker.state === "open") {
    breaker.totalShortCircuited += 1;
    const retryAfterMs = breaker.openedAt
      ? Math.max(0, breaker.config.recoveryTimeoutMs - (now() - breaker.openedAt))
      : breaker.config.recoveryTimeoutMs;
    throw new CircuitOpenError(name, retryAfterMs);
  }

  if (breaker.state === "half-open") {
    if (breaker.halfOpenInFlight >= breaker.config.halfOpenMaxCalls) {
      breaker.totalShortCircuited += 1;
      throw new CircuitOpenError(name, breaker.config.recoveryTimeoutMs);
    }
    breaker.halfOpenInFlight += 1;
  }

  try {
    const result = await fn();
    onSuccess(breaker);
    return result;
  } catch (error) {
    onFailure(breaker);
    throw error;
  }
}

export type CircuitBreakerSnapshot = {
  name: string;
  state: CircuitState;
  consecutiveFailures: number;
  failureThreshold: number;
  openedAt: string | null;
  lastFailureAt: string | null;
  totalFailures: number;
  totalSuccesses: number;
  totalShortCircuited: number;
};

function snapshotOf(breaker: BreakerRuntime): CircuitBreakerSnapshot {
  refreshState(breaker);
  return {
    name: breaker.name,
    state: breaker.state,
    consecutiveFailures: breaker.consecutiveFailures,
    failureThreshold: breaker.config.failureThreshold,
    openedAt: breaker.openedAt ? new Date(breaker.openedAt).toISOString() : null,
    lastFailureAt: breaker.lastFailureAt
      ? new Date(breaker.lastFailureAt).toISOString()
      : null,
    totalFailures: breaker.totalFailures,
    totalSuccesses: breaker.totalSuccesses,
    totalShortCircuited: breaker.totalShortCircuited,
  };
}

export function circuitBreakerSnapshot(name: string): CircuitBreakerSnapshot | null {
  const breaker = getState().breakers.get(name);
  return breaker ? snapshotOf(breaker) : null;
}

export function allCircuitBreakerSnapshots(): CircuitBreakerSnapshot[] {
  return [...getState().breakers.values()].map(snapshotOf);
}

/** Named breakers for the platform's unstable dependencies (STEP 3). */
export const CIRCUITS = {
  shopify: "shopify",
  openai: "openai",
  email: "email",
  bridge: "internal-bridge",
  webhooks: "workspace-webhooks",
} as const;

export type CircuitName = (typeof CIRCUITS)[keyof typeof CIRCUITS];

/** Reset — test-only. */
export function resetCircuitBreakers(): void {
  globalStore.__bybeltCircuitBreakers = { breakers: new Map() };
}
