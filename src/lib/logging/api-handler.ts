/**
 * API route wrapper (Phase 24B).
 *
 * Binds request context + structured request logging for App Router handlers
 * that are not already wrapped with {@link withRequestLogging}.
 */

import {
  bindRequestContext,
  type RequestContext,
} from "@/lib/logging/request-context";
import { logRequest } from "@/lib/logging/request-log";
import {
  BYBELT_REQUEST_ID_HEADER,
  REQUEST_ID_HEADER,
} from "@/lib/logging/request-id";

function routeOf(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return "unknown";
  }
}

function attachResponseRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  if (!headers.has(REQUEST_ID_HEADER)) headers.set(REQUEST_ID_HEADER, requestId);
  if (!headers.has(BYBELT_REQUEST_ID_HEADER)) {
    headers.set(BYBELT_REQUEST_ID_HEADER, requestId);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export type ApiHandlerContext = {
  requestId: string;
  requestContext: RequestContext;
};

type ApiHandler = (
  request: Request,
  context: ApiHandlerContext,
) => Response | Promise<Response>;

/**
 * Standard API route entry: bind correlation context, log duration, echo headers.
 * Does not alter response bodies.
 */
export function withApiRoute(handler: ApiHandler): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const requestContext = bindRequestContext(request);
    const route = routeOf(request);
    const startedAt = Date.now();

    try {
      const response = await handler(request, {
        requestId: requestContext.requestId,
        requestContext,
      });
      logRequest({
        requestId: requestContext.requestId,
        route,
        method: request.method,
        workspaceId: requestContext.workspaceId,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return attachResponseRequestId(response, requestContext.requestId);
    } catch (error) {
      logRequest({
        requestId: requestContext.requestId,
        route,
        method: request.method,
        workspaceId: requestContext.workspaceId,
        status: 500,
        durationMs: Date.now() - startedAt,
        event: "request_error",
      });
      throw error;
    }
  };
}
