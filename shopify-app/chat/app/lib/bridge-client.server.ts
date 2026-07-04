import { randomUUID } from "node:crypto";
import { recordDeadLetter } from "./dead-letter.server";

/**
 * Production-grade client for the internal Shopify-app -> Main-app bridge.
 *
 * Replaces ad-hoc `fetch()` / `void fetch().catch(() => undefined)` calls with a
 * single reusable client that provides: configurable timeout, per-request IDs,
 * structured logging, retry with exponential backoff, retryable/permanent error
 * classification, HTTP status validation, JSON response validation, and typed
 * error classes.
 *
 * Authentication and the internal secret contract are preserved exactly:
 * every request carries the `X-Bybelt-Internal-Secret` header, and a missing
 * secret raises a permanent {@link BridgeConfigError}.
 */

const DEFAULT_MAIN_INTERNAL_URL = "http://127.0.0.1:3004";
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 200;

export type BridgeMethod = "POST" | "PUT";

export type BridgeRequestOptions = {
  method: BridgeMethod;
  body: Record<string, unknown>;
  /** Correlate retries + the main-app side with one id. Auto-generated when omitted. */
  requestId?: string;
  /** Per-call override; falls back to BYBELT_BRIDGE_TIMEOUT_MS then the default. */
  timeoutMs?: number;
  /** Per-call override; falls back to BYBELT_BRIDGE_MAX_ATTEMPTS then the default. */
  maxAttempts?: number;
  /** Bridge event type, used for dead-letter classification (Phase 20). */
  event?: string;
  /** Tenant/shop context recorded alongside a dead-letter entry (Phase 20). */
  workspaceId?: string | null;
  shop?: string | null;
};

// --- Error model -----------------------------------------------------------

export abstract class BridgeError extends Error {
  /** Whether retrying the request could plausibly succeed. */
  abstract readonly retryable: boolean;
  readonly requestId: string;
  readonly path: string;

  constructor(message: string, requestId: string, path: string) {
    super(message);
    this.name = new.target.name;
    this.requestId = requestId;
    this.path = path;
  }
}

/** Missing/invalid configuration (e.g. no internal secret). Never retryable. */
export class BridgeConfigError extends BridgeError {
  readonly retryable = false;
}

/** Transport-level failure: DNS/connection error or timeout. Retryable. */
export class BridgeNetworkError extends BridgeError {
  readonly retryable = true;
  readonly isTimeout: boolean;
  readonly cause?: unknown;

  constructor(
    message: string,
    requestId: string,
    path: string,
    isTimeout: boolean,
    cause?: unknown,
  ) {
    super(message, requestId, path);
    this.isTimeout = isTimeout;
    this.cause = cause;
  }
}

/** Non-2xx HTTP response. Retryable only for 408/425/429/5xx. */
export class BridgeHttpError extends BridgeError {
  readonly retryable: boolean;
  readonly status: number;

  constructor(
    message: string,
    requestId: string,
    path: string,
    status: number,
  ) {
    super(message, requestId, path);
    this.status = status;
    this.retryable = status === 408 || status === 425 || status === 429 || status >= 500;
  }
}

/** 2xx response whose body was declared JSON but failed to parse. Not retryable. */
export class BridgeResponseError extends BridgeError {
  readonly retryable = false;
}

// --- Structured logging ----------------------------------------------------

type LogLevel = "info" | "warn" | "error";

type LogFields = {
  event: string;
  requestId: string;
  method?: string;
  path?: string;
  attempt?: number;
  maxAttempts?: number;
  status?: number;
  durationMs?: number;
  retryable?: boolean;
  error?: string;
  errorType?: string;
};

export function logBridge(level: LogLevel, fields: LogFields): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    component: "bridge-client",
    ...fields,
  });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/**
 * Log a bridge failure from a fire-and-forget call site so the exception is
 * observable even when the caller intentionally does not await/rethrow.
 */
export function logBridgeFireAndForgetError(event: string, error: unknown): void {
  const bridgeError = error instanceof BridgeError ? error : null;
  logBridge("error", {
    event,
    requestId: bridgeError?.requestId ?? "unknown",
    path: bridgeError?.path,
    retryable: bridgeError?.retryable,
    errorType: error instanceof Error ? error.name : typeof error,
    error: error instanceof Error ? error.message : String(error),
  });
}

// --- Config ----------------------------------------------------------------

function resolveConfig(requestId: string, path: string) {
  const secret = process.env.BYBELT_INTERNAL_SECRET?.trim();
  if (!secret) {
    // Message preserved from the previous implementation for parity.
    throw new BridgeConfigError(
      "BYBELT_INTERNAL_SECRET is not configured.",
      requestId,
      path,
    );
  }
  const base = (
    process.env.BYBELT_MAIN_INTERNAL_URL ?? DEFAULT_MAIN_INTERNAL_URL
  ).replace(/\/$/, "");
  return { secret, base };
}

function positiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// --- Core client -----------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelayMs(attempt: number): number {
  const exponential = BASE_BACKOFF_MS * 2 ** (attempt - 1);
  // Full jitter to avoid synchronized retries across concurrent webhooks.
  return Math.round(exponential * (0.5 + Math.random() * 0.5));
}

async function extractServerError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload?.error?.trim()) return payload.error.trim();
  } catch {
    // Non-JSON or empty error body — fall through to the status code.
  }
  return `status ${response.status}`;
}

async function attemptRequest<T>(
  path: string,
  options: BridgeRequestOptions,
  requestId: string,
  attempt: number,
  timeoutMs: number,
): Promise<T | null> {
  const { secret, base } = resolveConfig(requestId, path);
  const startedAt = Date.now();

  logBridge("info", {
    event: "bridge_request_start",
    requestId,
    method: options.method,
    path,
    attempt,
  });

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        "X-Bybelt-Internal-Secret": secret,
        "X-Bybelt-Request-Id": requestId,
        "X-Request-ID": requestId,
      },
      body: JSON.stringify(options.body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    const isTimeout =
      cause instanceof Error &&
      (cause.name === "TimeoutError" || cause.name === "AbortError");
    throw new BridgeNetworkError(
      isTimeout
        ? `Main app bridge request timed out after ${timeoutMs}ms (${path})`
        : `Main app bridge request could not reach the main app (${path})`,
      requestId,
      path,
      isTimeout,
      cause,
    );
  }

  const durationMs = Date.now() - startedAt;

  // Validate HTTP status.
  if (!response.ok) {
    const details = await extractServerError(response);
    // Message shape preserved from the previous implementation for parity.
    throw new BridgeHttpError(
      `Main app bridge request failed (${path}): ${details}`,
      requestId,
      path,
      response.status,
    );
  }

  logBridge("info", {
    event: "bridge_request_ok",
    requestId,
    method: options.method,
    path,
    attempt,
    status: response.status,
    durationMs,
  });

  // Validate JSON response when a body is present.
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204 || !contentType.includes("application/json")) {
    return null;
  }
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text) as T;
  } catch (cause) {
    throw new BridgeResponseError(
      `Main app bridge returned invalid JSON (${path}): ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
      requestId,
      path,
    );
  }
}

/**
 * Perform an authenticated internal bridge request with retries.
 *
 * Resolves to the parsed JSON body (or `null` when the response has no JSON
 * body). Rejects with a typed {@link BridgeError} once retries are exhausted or
 * a permanent failure is hit. Every failure is logged before it propagates.
 */
export async function bridgeRequest<T = unknown>(
  path: string,
  options: BridgeRequestOptions,
): Promise<T | null> {
  const requestId = options.requestId ?? randomUUID();
  const timeoutMs =
    options.timeoutMs ?? positiveIntEnv("BYBELT_BRIDGE_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
  const maxAttempts =
    options.maxAttempts ??
    positiveIntEnv("BYBELT_BRIDGE_MAX_ATTEMPTS", DEFAULT_MAX_ATTEMPTS);

  let lastError: BridgeError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await attemptRequest<T>(path, options, requestId, attempt, timeoutMs);
    } catch (error) {
      const bridgeError =
        error instanceof BridgeError
          ? error
          : new BridgeNetworkError(
              `Unexpected bridge failure (${path}): ${
                error instanceof Error ? error.message : String(error)
              }`,
              requestId,
              path,
              false,
              error,
            );
      lastError = bridgeError;

      const canRetry = bridgeError.retryable && attempt < maxAttempts;
      logBridge(canRetry ? "warn" : "error", {
        event: canRetry ? "bridge_request_retry" : "bridge_request_failed",
        requestId,
        method: options.method,
        path,
        attempt,
        maxAttempts,
        status: bridgeError instanceof BridgeHttpError ? bridgeError.status : undefined,
        retryable: bridgeError.retryable,
        errorType: bridgeError.name,
        error: bridgeError.message,
      });

      if (!canRetry) {
        // Permanent failure for this delivery (non-retryable, or retries
        // exhausted): capture it in the dead-letter store before propagating.
        // Config errors are excluded — they signal misconfiguration, not a lost
        // operation payload, and would otherwise flood the store.
        if (options.event && !(bridgeError instanceof BridgeConfigError)) {
          void recordDeadLetter({
            event: options.event,
            workspaceId: options.workspaceId ?? null,
            shop: options.shop ?? null,
            requestId,
            reason: bridgeError.message,
            errorType: bridgeError.name,
            retryCount: attempt,
          });
        }
        throw bridgeError;
      }
      await sleep(backoffDelayMs(attempt));
    }
  }

  // Unreachable in practice: the loop either returns or throws.
  throw lastError ??
    new BridgeNetworkError(
      `Main app bridge request exhausted retries (${path})`,
      requestId,
      path,
      false,
    );
}
