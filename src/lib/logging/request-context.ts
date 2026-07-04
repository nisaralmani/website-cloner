/**
 * Request-scoped correlation context (Phase 24B).
 *
 * A single AsyncLocalStorage store carries the active RequestContext through
 * middleware-initialized requests, API handlers, services, AI pipelines, and
 * Redis fan-out. Callers enrich context in-place (`patchRequestContext`) as
 * workspace / conversation ids become known — never mint a second request id.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { setLogContextProvider } from "@/lib/logging/logger";
import {
  BYBELT_REQUEST_ID_HEADER,
  REQUEST_ID_HEADER,
  requestIdFrom,
} from "@/lib/logging/request-id";

export type RequestContext = {
  requestId: string;
  workspaceId?: string | null;
  conversationId?: string | null;
  shop?: string | null;
  operatorId?: string | null;
  customerId?: string | null;
  userId?: string | null;
  channel?: string | null;
  route?: string | null;
  method?: string | null;
  host?: string | null;
  timestamp: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

function routeOf(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return "unknown";
  }
}

function hostOf(request: Request): string | undefined {
  return (
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim() ||
    undefined
  );
}

/** Build a context object from an inbound Request without entering ALS. */
export function contextFromRequest(
  request: Request,
  partial?: Partial<Omit<RequestContext, "requestId" | "timestamp">>,
): RequestContext {
  return {
    requestId: requestIdFrom(request),
    route: partial?.route ?? routeOf(request),
    method: partial?.method ?? request.method,
    host: partial?.host ?? hostOf(request),
    timestamp: new Date().toISOString(),
    workspaceId: partial?.workspaceId,
    conversationId: partial?.conversationId,
    shop: partial?.shop,
    operatorId: partial?.operatorId,
    customerId: partial?.customerId,
    userId: partial?.userId,
    channel: partial?.channel,
  };
}

/**
 * Bind (or replace) the active request context for the current async chain.
 * Idempotent for requestId: reuses the incoming header when present.
 */
export function bindRequestContext(
  request: Request,
  partial?: Partial<Omit<RequestContext, "requestId" | "timestamp">>,
): RequestContext {
  const existing = storage.getStore();
  const next = {
    ...contextFromRequest(request, partial),
    ...(existing?.requestId === requestIdFrom(request) ? existing : {}),
    ...partial,
    requestId: requestIdFrom(request),
  };
  storage.enterWith(next);
  return next;
}

/** Run `fn` inside a child context (e.g. Redis subscriber replay). */
export function runWithRequestContext<T>(
  partial: Partial<RequestContext> & Pick<RequestContext, "requestId">,
  fn: () => T,
): T {
  const parent = storage.getStore();
  const merged: RequestContext = {
    requestId: partial.requestId,
    timestamp: parent?.timestamp ?? new Date().toISOString(),
    route: partial.route ?? parent?.route,
    method: partial.method ?? parent?.method,
    host: partial.host ?? parent?.host,
    workspaceId: partial.workspaceId ?? parent?.workspaceId,
    conversationId: partial.conversationId ?? parent?.conversationId,
    shop: partial.shop ?? parent?.shop,
    operatorId: partial.operatorId ?? parent?.operatorId,
    customerId: partial.customerId ?? parent?.customerId,
    userId: partial.userId ?? parent?.userId,
    channel: partial.channel ?? parent?.channel,
  };
  return storage.run(merged, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

/** Merge fields into the active context (no-op when unbound). */
export function patchRequestContext(
  patch: Partial<Omit<RequestContext, "requestId" | "timestamp">>,
): void {
  const current = storage.getStore();
  if (!current) return;
  storage.enterWith({ ...current, ...patch });
}

/** Headers to propagate on outbound internal / bridge HTTP calls. */
export function outboundRequestIdHeaders(requestId?: string): Record<string, string> {
  const id = requestId ?? getRequestId();
  if (!id) return {};
  return {
    [REQUEST_ID_HEADER]: id,
    [BYBELT_REQUEST_ID_HEADER]: id,
  };
}

setLogContextProvider(() => {
  const ctx = storage.getStore();
  if (!ctx) return {};
  return {
    requestId: ctx.requestId,
    workspaceId: ctx.workspaceId ?? undefined,
    conversationId: ctx.conversationId ?? undefined,
    shop: ctx.shop ?? undefined,
    operatorId: ctx.operatorId ?? undefined,
    customerId: ctx.customerId ?? undefined,
    userId: ctx.userId ?? undefined,
    channel: ctx.channel ?? undefined,
    route: ctx.route ?? undefined,
    method: ctx.method ?? undefined,
    host: ctx.host ?? undefined,
  };
});
