import db from "../db.server";
import { registerWebhooks, sessionStorage, unauthenticated } from "../shopify.server";
import { registerWebhooksWithRetry } from "./webhook-registration.server";
import { countDeadLetters } from "./dead-letter.server";
import { reconcileWorkspaceBillingFromShopify } from "./billing-reconcile.server";

/**
 * Shopify reconciliation job (Phase 20 — Task 3).
 *
 * Periodically sweeps every linked shop and verifies the invariants that the
 * partial-success windows in the install/webhook/bridge flow can violate:
 *   - ShopLink consistency        (row present + has a workspace)
 *   - workspace linkage           (workspaceId non-empty)
 *   - Shopify session presence    (offline token exists → shop is reachable)
 *   - webhook registration        (re-registered idempotently as a safe repair)
 *   - stale synchronization state (last contact sync older than the threshold)
 *   - missing bridge events       (dead-letter backlog is surfaced)
 *
 * Safety contract: it only performs *additive, idempotent* repairs
 * (re-registering webhooks, which never deletes or mutates merchant data). It
 * never overwrites metafields, customers, orders, or the workspace link, and
 * never re-notifies "linked" blindly. Anything it cannot safely auto-heal (a
 * shop needing re-auth, a stale sync, a dead-letter backlog) is reported for an
 * operator, not silently mutated.
 */

export type ShopReconResult = {
  shop: string;
  workspaceId: string;
  hasSession: boolean;
  needsReauth: boolean;
  /** true = re-registered, false = attempt failed, null = skipped. */
  webhooksReregistered: boolean | null;
  /** true = plan converged to Shopify truth, false = attempt failed, null = skipped. */
  billingReconciled: boolean | null;
  /** Plan tag Shopify reports as active for this shop (null when reconcile skipped/failed). */
  billingPlanTag: string | null;
  staleSync: boolean;
  lastContactSyncAt: string | null;
  issues: string[];
};

export type ReconciliationReport = {
  ok: boolean;
  checkedAt: string;
  totalShops: number;
  repaired: number;
  needsReauthCount: number;
  staleSyncCount: number;
  invalidLinkCount: number;
  billingReconciledCount: number;
  billingFailedCount: number;
  deadLetterCount: number;
  shops: ShopReconResult[];
};

function staleThresholdHours(): number {
  const raw = process.env.BYBELT_SYNC_STALE_HOURS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}

function log(level: "info" | "warn", fields: Record<string, unknown>): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    component: "reconcile",
    ...fields,
  });
  if (level === "warn") console.warn(line);
  else console.log(line);
}

/**
 * Run one reconciliation pass.
 * @param options.repair When true (default), perform safe idempotent repairs
 *   (webhook re-registration). When false, run in report-only/dry-run mode.
 */
export async function runReconciliation(
  options: { repair?: boolean } = {},
): Promise<ReconciliationReport> {
  const repair = options.repair ?? true;
  const checkedAt = new Date().toISOString();
  const staleMs = staleThresholdHours() * 60 * 60 * 1000;
  const now = Date.now();

  const links = await db.shopLink.findMany();
  const shops: ShopReconResult[] = [];
  let repaired = 0;
  let needsReauthCount = 0;
  let staleSyncCount = 0;
  let invalidLinkCount = 0;
  let billingReconciledCount = 0;
  let billingFailedCount = 0;

  for (const link of links) {
    const issues: string[] = [];

    // 1. Workspace linkage consistency.
    const workspaceId = link.workspaceId?.trim() ?? "";
    if (!workspaceId) {
      issues.push("missing_workspace_id");
      invalidLinkCount += 1;
    }

    // 2. Shopify session presence (offline token → shop is reachable).
    let hasSession = false;
    try {
      const sessions = await sessionStorage.findSessionsByShop(link.shop);
      hasSession = sessions.length > 0;
    } catch (error) {
      issues.push(
        `session_lookup_failed:${error instanceof Error ? error.message : "unknown"}`,
      );
    }
    const needsReauth = !hasSession;
    if (needsReauth) {
      issues.push("no_shopify_session_needs_reauth");
      needsReauthCount += 1;
    }

    // 3. Webhook registration — safe, idempotent repair (adds only missing subs).
    let webhooksReregistered: boolean | null = null;
    if (repair && hasSession && workspaceId) {
      try {
        const sessions = await sessionStorage.findSessionsByShop(link.shop);
        const session = sessions.find((s) => !s.isOnline) ?? sessions[0];
        if (session) {
          webhooksReregistered = await registerWebhooksWithRetry(
            () => registerWebhooks({ session }),
            { shop: link.shop, origin: "reconcile" },
          );
          if (webhooksReregistered) repaired += 1;
          else issues.push("webhook_reregistration_failed");
        }
      } catch (error) {
        webhooksReregistered = false;
        issues.push(
          `webhook_reregistration_error:${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    }

    // 3b. Billing reconciliation — converge the workspace plan to Shopify's
    //     live subscription state. This is the automatic safety net when an
    //     `app_subscriptions/update` webhook is lost or its bridge call fails:
    //     the sweep re-derives the truth from Shopify and re-applies it. It is
    //     idempotent (absolute-state write), so re-running it is a no-op when the
    //     workspace is already correct.
    let billingReconciled: boolean | null = null;
    let billingPlanTag: string | null = null;
    if (repair && hasSession && workspaceId) {
      try {
        const { admin } = await unauthenticated.admin(link.shop);
        const result = await reconcileWorkspaceBillingFromShopify(
          admin,
          link.shop,
          workspaceId,
        );
        billingReconciled = true;
        billingPlanTag = result.planTag;
        billingReconciledCount += 1;
      } catch (error) {
        billingReconciled = false;
        billingFailedCount += 1;
        issues.push(
          `billing_reconcile_error:${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    }

    // 4. Stale synchronization state (report only — never auto-triggers a sync
    //    here; the existing sync cron owns that).
    const lastSync = link.lastContactSyncAt ? link.lastContactSyncAt.getTime() : null;
    const staleSync = lastSync === null || now - lastSync > staleMs;
    if (staleSync) {
      issues.push(lastSync === null ? "never_synced" : "stale_sync");
      staleSyncCount += 1;
    }

    shops.push({
      shop: link.shop,
      workspaceId,
      hasSession,
      needsReauth,
      webhooksReregistered,
      billingReconciled,
      billingPlanTag,
      staleSync,
      lastContactSyncAt: link.lastContactSyncAt?.toISOString() ?? null,
      issues,
    });
  }

  // 5. Missing bridge events — surface the dead-letter backlog.
  let deadLetterCount = 0;
  try {
    deadLetterCount = await countDeadLetters();
  } catch {
    // Non-fatal: reconciliation still reports shop-level state.
  }

  const report: ReconciliationReport = {
    ok: true,
    checkedAt,
    totalShops: links.length,
    repaired,
    needsReauthCount,
    staleSyncCount,
    invalidLinkCount,
    billingReconciledCount,
    billingFailedCount,
    deadLetterCount,
    shops,
  };

  log("info", {
    event: "reconciliation_complete",
    repair,
    totalShops: report.totalShops,
    repaired,
    needsReauthCount,
    staleSyncCount,
    invalidLinkCount,
    billingReconciledCount,
    billingFailedCount,
    deadLetterCount,
  });

  return report;
}
