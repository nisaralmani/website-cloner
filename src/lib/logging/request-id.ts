/**
 * Request ID helpers (Phase 24B).
 *
 * Edge-safe: no Node-only imports. Used by middleware, API routes, and the
 * request-context store.
 */

export const REQUEST_ID_HEADER = "x-request-id";

/** Legacy bridge header — same value as REQUEST_ID_HEADER when propagating. */
export const BYBELT_REQUEST_ID_HEADER = "x-bybelt-request-id";

export function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `req_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

/**
 * Resolve the correlation id for an inbound request.
 * Reuses X-Request-ID or X-Bybelt-Request-Id when present; otherwise generates one.
 */
export function requestIdFrom(request: Request): string {
  return (
    request.headers.get(REQUEST_ID_HEADER)?.trim() ||
    request.headers.get(BYBELT_REQUEST_ID_HEADER)?.trim() ||
    newRequestId()
  );
}
