import { and, isNull, ne } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { workspaceSubscriptions } from "@/db/schema";
import { applyShopifyPlan } from "@/lib/billing/apply-shopify-plan";

/**
 * One-time (idempotent) backfill for the migration to Shopify-managed billing.
 *
 * Before this migration, plans were a simulation — a workspace could be on a paid
 * tier with no real payment. Now Shopify is the source of truth and every paid,
 * active plan carries a `shopifySubscriptionId` (set by {@link applyShopifyPlan}
 * on activation / reconciliation). Therefore any row on a paid tier with a NULL
 * subscription id is a leftover simulation artifact that was never actually paid.
 *
 * The reconcile sweep already corrects *linked* shops (it re-derives their plan
 * from Shopify). This handles the remainder — workspaces with no Shopify link at
 * all — by resetting them to Free, which also clears premium feature flags.
 *
 * Idempotent: after one pass no paid+NULL-subscription rows remain, so repeated
 * runs match zero rows. Safe to run on every boot.
 */
export async function backfillOrphanedPaidPlans(db: AppDatabase): Promise<{ reset: number }> {
  const orphans = await selectAll(
    db
      .select({ workspaceId: workspaceSubscriptions.workspaceId })
      .from(workspaceSubscriptions)
      .where(
        and(
          ne(workspaceSubscriptions.planTag, "Free"),
          isNull(workspaceSubscriptions.shopifySubscriptionId),
        ),
      ),
  );

  let reset = 0;
  for (const orphan of orphans) {
    const result = await applyShopifyPlan(db, {
      workspaceId: orphan.workspaceId,
      planTag: "Free",
      active: false,
      shopifySubscriptionId: null,
    });
    if (result.ok) reset += 1;
  }

  return { reset };
}
