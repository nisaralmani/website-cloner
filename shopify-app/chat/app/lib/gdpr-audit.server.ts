import { recordDeadLetter } from "./dead-letter.server";

/**
 * GDPR compliance audit trail (Phase 20 — Task 4).
 *
 * The three mandatory Shopify compliance webhooks — `customers/redact`,
 * `shop/redact`, `customers/data_request` — forward to the main app over the
 * bridge, which already provides bounded exponential-backoff retry + timeout.
 * This module adds the missing pieces around that call: structured, queryable
 * audit logging of every compliance request and its outcome, dead-letter capture
 * of permanent failures, and clear failure reporting.
 *
 * The GDPR flows themselves are NOT redesigned. `runGdprBridgeOp` wraps the
 * existing bridge call: on success it logs a completed audit event; on failure
 * it logs a failed audit event, records a dead-letter entry, and re-throws so
 * the webhook returns non-2xx and Shopify re-delivers (graceful retry on
 * transient failures — Shopify retries compliance webhooks for up to 48h).
 */

export type GdprEvent =
  | "customers_redact"
  | "shop_redact"
  | "customers_data_request";

export type GdprAuditContext = {
  event: GdprEvent;
  shop: string;
  workspaceId: string | null;
  /** Present for customer-scoped events; omitted/hashed-out for shop redact. */
  email?: string | null;
};

function auditLog(
  level: "info" | "error",
  phase: "received" | "forwarded" | "skipped" | "failed",
  ctx: GdprAuditContext,
  extra?: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    component: "gdpr-audit",
    event: `gdpr_${ctx.event}_${phase}`,
    gdprEvent: ctx.event,
    phase,
    shop: ctx.shop,
    workspaceId: ctx.workspaceId,
    // Never log the raw email — only whether one was present, to keep the audit
    // trail itself GDPR-safe.
    hasEmail: Boolean(ctx.email),
    ...extra,
  });
  if (level === "error") console.error(line);
  else console.log(line);
}

/** Log receipt of a compliance webhook (before any downstream work). */
export function auditGdprReceived(ctx: GdprAuditContext): void {
  auditLog("info", "received", ctx);
}

/**
 * Log that a compliance webhook was intentionally a no-op (e.g. no ShopLink, so
 * there is no tenant data to act on). This is a legitimate "nothing to erase"
 * outcome and must be distinguishable from a silent drop.
 */
export function auditGdprSkipped(ctx: GdprAuditContext, reason: string): void {
  auditLog("info", "skipped", ctx, { reason });
}

/**
 * Execute the bridge side of a GDPR request with audit logging, dead-letter
 * capture, and clear failure reporting. Re-throws on failure so Shopify retries.
 */
export async function runGdprBridgeOp(
  ctx: GdprAuditContext,
  requestId: string,
  op: () => Promise<unknown>,
): Promise<void> {
  const startedAt = Date.now();
  try {
    await op();
    auditLog("info", "forwarded", ctx, {
      requestId,
      durationMs: Date.now() - startedAt,
      result: "completed",
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    auditLog("error", "failed", ctx, {
      requestId,
      durationMs: Date.now() - startedAt,
      errorType: error instanceof Error ? error.name : typeof error,
      error: reason,
    });
    // Capture in the dead-letter store so a permanently-failing erasure is
    // visible even though Shopify will also keep re-delivering.
    await recordDeadLetter({
      event: `gdpr_${ctx.event}`,
      workspaceId: ctx.workspaceId,
      shop: ctx.shop,
      requestId,
      reason,
      errorType: error instanceof Error ? error.name : undefined,
      retryCount: 0,
    });
    throw error;
  }
}
