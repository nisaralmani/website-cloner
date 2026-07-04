/**
 * Security audit logger (Phase 19).
 *
 * A dedicated, structured channel for security-relevant events, built on the
 * shared Phase 18 logger. Every event carries a stable schema — timestamp
 * (added by the logger), requestId, workspaceId, sourceIp, route, eventType —
 * so security events are filterable (`event: "security"`) and correlatable with
 * request logs.
 *
 * This only records events. It does NOT block, rate-limit, or change any
 * control flow — callers decide what to do; the audit trail is a side effect.
 */

import { logger } from "@/lib/logging/logger";
import { bindRequestContext, getRequestId } from "@/lib/logging/request-context";
import { requestIdFrom } from "@/lib/logging/request-id";

export type SecurityEventType =
  | "auth_failure"
  | "invalid_internal_secret"
  | "unauthorized_workspace_access"
  | "shopify_verification_failed"
  | "invalid_webhook_signature"
  | "repeated_failed_requests";

export type SecurityEvent = {
  type: SecurityEventType;
  requestId?: string;
  workspaceId?: string | null;
  sourceIp?: string | null;
  route?: string | null;
  /** Optional non-sensitive context (never include secrets). */
  detail?: string;
};

function sourceIpFrom(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || undefined;
}

function routeFrom(request: Request): string | undefined {
  try {
    return new URL(request.url).pathname;
  } catch {
    return undefined;
  }
}

/** Record a security event. Never throws. */
export function logSecurityEvent(event: SecurityEvent): void {
  try {
    logger.warn("security", {
      event: "security",
      eventType: event.type,
      requestId: event.requestId ?? getRequestId() ?? undefined,
      workspaceId: event.workspaceId ?? undefined,
      sourceIp: event.sourceIp ?? undefined,
      route: event.route ?? undefined,
      detail: event.detail,
    });
  } catch {
    // Auditing must never break the request path.
  }
}

/**
 * Convenience overload that derives sourceIp + route from a `Request`.
 */
export function logSecurityEventForRequest(
  request: Request,
  event: Omit<SecurityEvent, "sourceIp" | "route">,
): void {
  bindRequestContext(request);
  logSecurityEvent({
    ...event,
    requestId: event.requestId ?? requestIdFrom(request),
    sourceIp: sourceIpFrom(request),
    route: routeFrom(request),
  });
}
