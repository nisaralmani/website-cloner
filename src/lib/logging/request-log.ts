/**
 * Request-scoped structured logging (Phase 18 + 24B).
 *
 * Provides a stable per-request field schema on top of the shared logger and
 * binds the active {@link RequestContext} for downstream services.
 */

import { bindRequestContext, patchRequestContext } from "@/lib/logging/request-context";
import { logger } from "@/lib/logging/logger";
import {
  BYBELT_REQUEST_ID_HEADER,
  newRequestId,
  REQUEST_ID_HEADER,
  requestIdFrom,
} from "@/lib/logging/request-id";

export {
  BYBELT_REQUEST_ID_HEADER,
  newRequestId,
  REQUEST_ID_HEADER,
  requestIdFrom,
};

export type RequestLogFields = {
  requestId: string;
  route: string;
  method?: string;
  workspaceId?: string | null;
  status?: number;
  durationMs?: number;
  event?: string;
};

/** Emit a single structured request log line. */
export function logRequest(fields: RequestLogFields): void {
  const level = fields.status && fields.status >= 500 ? "error" : "info";
  logger[level](fields.event ?? "request", {
    requestId: fields.requestId,
    route: fields.route,
    method: fields.method,
    workspaceId: fields.workspaceId ?? undefined,
    status: fields.status,
    duration: fields.durationMs,
    durationMs: fields.durationMs,
    event: fields.event ?? "request",
  });
}

function routeOf(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return "unknown";
  }
}

function attachResponseRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  if (!headers.has(REQUEST_ID_HEADER)) {
    headers.set(REQUEST_ID_HEADER, requestId);
  }
  if (!headers.has(BYBELT_REQUEST_ID_HEADER)) {
    headers.set(BYBELT_REQUEST_ID_HEADER, requestId);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export type RequestHandlerContext = {
  requestId: string;
};

/**
 * Wrap a Next.js route handler so every invocation binds request context,
 * logs requestId/route/method/status/duration, and echoes correlation headers.
 */
export function withRequestLogging(
  handler: (request: Request, context: RequestHandlerContext) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const ctx = bindRequestContext(request);
    const route = routeOf(request);
    const startedAt = Date.now();

    try {
      const response = await handler(request, { requestId: ctx.requestId });
      logRequest({
        requestId: ctx.requestId,
        route,
        method: request.method,
        workspaceId: ctx.workspaceId,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return attachResponseRequestId(response, ctx.requestId);
    } catch (error) {
      logRequest({
        requestId: ctx.requestId,
        route,
        method: request.method,
        workspaceId: ctx.workspaceId,
        status: 500,
        durationMs: Date.now() - startedAt,
        event: "request_error",
      });
      throw error;
    }
  };
}

/**
 * Bind request context and enrich with workspace / user ids after auth.
 * Safe to call multiple times — requestId is never regenerated.
 */
export function enrichRequestContext(fields: {
  workspaceId?: string | null;
  conversationId?: string | null;
  userId?: string | null;
  operatorId?: string | null;
  customerId?: string | null;
  shop?: string | null;
  channel?: string | null;
}): void {
  patchRequestContext(fields);
}
