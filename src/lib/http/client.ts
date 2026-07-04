/**
 * Production HTTP client (Phase 24B).
 *
 * Centralizes outbound fetch with: request-id propagation, bounded timeout via
 * AbortController, structured logging, duration measurement, and error
 * classification. Optional retry for idempotent/read operations.
 */

import { createComponentLogger } from "@/lib/logging/logger";
import { outboundRequestIdHeaders } from "@/lib/logging/request-context";

const log = createComponentLogger("http-client");

const DEFAULT_TIMEOUT_MS = 8_000;
const BASE_BACKOFF_MS = 200;

export type HttpErrorKind = "timeout" | "network" | "http" | "abort";

export class HttpClientError extends Error {
  readonly kind: HttpErrorKind;
  readonly status?: number;
  readonly url: string;
  readonly durationMs: number;
  readonly retryable: boolean;

  constructor(
    message: string,
    opts: {
      kind: HttpErrorKind;
      url: string;
      durationMs: number;
      status?: number;
      retryable?: boolean;
      cause?: unknown;
    },
  ) {
    super(message, { cause: opts.cause });
    this.name = "HttpClientError";
    this.kind = opts.kind;
    this.url = opts.url;
    this.durationMs = opts.durationMs;
    this.status = opts.status;
    this.retryable = opts.retryable ?? false;
  }
}

export type HttpRequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  cache?: RequestCache;
  /** Per-request timeout override. */
  timeoutMs?: number;
  /** Correlate with an explicit id (defaults to active request context). */
  requestId?: string;
  /** Structured log event name. */
  event?: string;
  /** Retry transient failures (network / 408 / 429 / 5xx). */
  retry?: boolean;
  maxAttempts?: number;
};

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function backoffDelayMs(attempt: number): number {
  const exponential = BASE_BACKOFF_MS * 2 ** (attempt - 1);
  return Math.round(exponential * (0.5 + Math.random() * 0.5));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptFetch(
  url: string,
  options: HttpRequestOptions,
  attempt: number,
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const event = options.event ?? "http_request";
  const method = options.method ?? "GET";
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(options.headers);
  for (const [key, value] of Object.entries(outboundRequestIdHeaders(options.requestId))) {
    if (!headers.has(key)) headers.set(key, value);
  }

  log.info(event, {
    event: `${event}_start`,
    method,
    url,
    attempt,
    maxAttempts: options.maxAttempts,
  });

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: options.body,
      cache: options.cache,
      signal: controller.signal,
    });
    const durationMs = Date.now() - startedAt;

    if (!response.ok) {
      const retryable = isRetryableStatus(response.status);
      log.warn(event, {
        event: `${event}_http_error`,
        method,
        url,
        status: response.status,
        durationMs,
        attempt,
        retryable,
      });
      throw new HttpClientError(`HTTP ${response.status} for ${url}`, {
        kind: "http",
        url,
        durationMs,
        status: response.status,
        retryable,
      });
    }

    log.info(event, {
      event: `${event}_success`,
      method,
      url,
      status: response.status,
      durationMs,
      attempt,
    });
    return response;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    if (error instanceof HttpClientError) throw error;

    const isAbort = error instanceof Error && error.name === "AbortError";
    const kind: HttpErrorKind = isAbort ? "timeout" : "network";
    log.error(event, {
      event: `${event}_failure`,
      method,
      url,
      durationMs,
      attempt,
      errorKind: kind,
      error: error instanceof Error ? error.message : String(error),
      retryable: true,
    });
    throw new HttpClientError(
      isAbort ? `Request timed out after ${timeoutMs}ms (${url})` : `Network error (${url})`,
      { kind, url, durationMs, retryable: true, cause: error },
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Perform an outbound HTTP request with logging, timeout, and optional retry.
 */
export async function httpRequest(url: string, options: HttpRequestOptions = {}): Promise<Response> {
  const maxAttempts = options.retry ? (options.maxAttempts ?? 3) : 1;
  let lastError: HttpClientError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await attemptFetch(url, { ...options, maxAttempts }, attempt);
    } catch (error) {
      const httpError =
        error instanceof HttpClientError
          ? error
          : new HttpClientError(String(error), {
              kind: "network",
              url,
              durationMs: 0,
              retryable: false,
              cause: error,
            });
      lastError = httpError;
      const canRetry = options.retry && httpError.retryable && attempt < maxAttempts;
      if (!canRetry) throw httpError;
      log.warn(options.event ?? "http_request", {
        event: `${options.event ?? "http_request"}_retry`,
        url,
        attempt,
        maxAttempts,
      });
      await sleep(backoffDelayMs(attempt));
    }
  }

  throw lastError ?? new HttpClientError(`HTTP request failed (${url})`, {
    kind: "network",
    url,
    durationMs: 0,
  });
}

/** Convenience: JSON GET/POST helpers built on {@link httpRequest}. */
export async function httpJson<T>(
  url: string,
  options: HttpRequestOptions & { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" } = {},
): Promise<T | null> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await httpRequest(url, { ...options, headers });
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204 || !contentType.includes("application/json")) {
    return null;
  }
  const text = await response.text();
  if (!text.trim()) return null;
  return JSON.parse(text) as T;
}
