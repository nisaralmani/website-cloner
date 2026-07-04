/**
 * Error tracking abstraction (Phase 18 + 24B).
 *
 * Provider-agnostic seam for reporting errors with full request correlation.
 */

import { logger } from "@/lib/logging/logger";
import { getRequestContext } from "@/lib/logging/request-context";

export type ErrorContext = {
  requestId?: string;
  route?: string;
  workspaceId?: string | null;
  conversationId?: string | null;
  component?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

export interface ErrorTracker {
  captureException(error: unknown, context?: ErrorContext): void;
}

function normalizeError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { name: "NonError", message: typeof error === "string" ? error : safeStringify(error) };
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function mergeContext(context?: ErrorContext): ErrorContext {
  const active = getRequestContext();
  return {
    requestId: context?.requestId ?? active?.requestId,
    route: context?.route ?? active?.route ?? undefined,
    workspaceId: context?.workspaceId ?? active?.workspaceId,
    conversationId: context?.conversationId ?? active?.conversationId,
    component: context?.component,
    tags: context?.tags,
    extra: context?.extra,
  };
}

export class ConsoleErrorTracker implements ErrorTracker {
  captureException(error: unknown, context?: ErrorContext): void {
    try {
      const normalized = normalizeError(error);
      const merged = mergeContext(context);
      logger.error("error_tracked", {
        event: "error_tracked",
        component: merged.component,
        errorName: normalized.name,
        errorMessage: normalized.message,
        stack: normalized.stack,
        requestId: merged.requestId,
        route: merged.route,
        workspaceId: merged.workspaceId ?? undefined,
        conversationId: merged.conversationId ?? undefined,
        tags: merged.tags,
        extra: merged.extra,
      });
    } catch {
      // Reporting must never throw.
    }
  }
}

let activeTracker: ErrorTracker = new ConsoleErrorTracker();

export function setErrorTracker(tracker: ErrorTracker): void {
  activeTracker = tracker;
}

export function getErrorTracker(): ErrorTracker {
  return activeTracker;
}

export function captureException(error: unknown, context?: ErrorContext): void {
  activeTracker.captureException(error, context);
}

export function recordError(error: unknown, context?: ErrorContext): void {
  activeTracker.captureException(error, context);
}
