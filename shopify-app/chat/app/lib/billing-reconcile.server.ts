import {
  getActiveSubscriptions,
  planTagFromSubscriptionName,
  type PlanTag,
} from "./billing.server";
import { activateMainAppPlan } from "./bybelt-main.server";

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export type BillingReconcileResult = {
  planTag: PlanTag;
  active: boolean;
  shopifySubscriptionId: string | null;
};

/**
 * Converge a workspace's plan to Shopify's *actual* current subscription state.
 *
 * Shopify is the source of truth. Rather than trusting a single webhook
 * payload's status (which races when a plan change fires CANCELLED for the old
 * subscription and ACTIVE for the new one in an undefined order), this always
 * re-reads the live `activeSubscriptions` and writes the derived plan. Because
 * it computes absolute state from Shopify, it is idempotent and order-independent
 * — the same function backs both the real-time webhook and the periodic
 * reconciliation sweep, so both converge to the identical result.
 */
export async function reconcileWorkspaceBillingFromShopify(
  admin: AdminGraphql,
  shop: string,
  workspaceId: string,
): Promise<BillingReconcileResult> {
  const active = await getActiveSubscriptions(admin);
  const current = active.find((sub) => sub.status?.toUpperCase() === "ACTIVE") ?? null;

  const planTag: PlanTag = current ? planTagFromSubscriptionName(current.name) : "Free";
  const shopifySubscriptionId = current?.id ?? null;

  await activateMainAppPlan(workspaceId, {
    planTag,
    // A workspace with no active Shopify subscription is downgraded to Free; the
    // main app keys "active" off an ACTIVE status.
    status: current ? "ACTIVE" : "CANCELLED",
    shopifySubscriptionId,
    shop,
  });

  return { planTag, active: Boolean(current), shopifySubscriptionId };
}
