import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { workspaceSubscriptions, workspaces } from "@/db/schema";
import { toWorkspacePlan } from "@/lib/billing/plans";

const PLAN_TAGS = new Set(["Free", "Essentials", "Plus", "Pro"]);

const FREE_FEATURE_FLAGS = { analyticsEnabled: 0, helpdeskEnabled: 0 };

function planFeatureFlags(planTag: string) {
  if (planTag === "Free") return FREE_FEATURE_FLAGS;
  if (planTag === "Essentials") return { analyticsEnabled: 1, helpdeskEnabled: 0 };
  return { analyticsEnabled: 1, helpdeskEnabled: 1 };
}

function monthlyCentsFor(tag: string): number {
  return tag === "Free" ? 0 : tag === "Essentials" ? 2500 : tag === "Plus" ? 9500 : 25000;
}

/**
 * Apply a Shopify-driven plan change to a workspace. This is the ONLY writer of a
 * paid, active subscription — it is invoked exclusively from the internal
 * `app_subscriptions/update` activation endpoint. Shopify is the source of truth:
 * `active` reflects the real subscription status, so a non-active status resets
 * the workspace to Free and clears premium feature flags.
 */
export async function applyShopifyPlan(
  db: AppDatabase,
  input: {
    workspaceId: string;
    planTag: string;
    active: boolean;
    shopifySubscriptionId?: string | null;
  },
) {
  const tag = input.planTag.trim();
  if (!PLAN_TAGS.has(tag)) {
    return { ok: false as const, error: "planTag is invalid" };
  }

  const existing = await selectOne(
    db
      .select()
      .from(workspaceSubscriptions)
      .where(eq(workspaceSubscriptions.workspaceId, input.workspaceId)),
  );
  if (!existing) {
    return { ok: false as const, reason: "not_found" as const };
  }

  // A non-active status (cancelled / expired / declined / frozen) drops the
  // workspace to Free regardless of which plan the charge was for.
  const effectiveTag = input.active ? tag : "Free";
  const monthlyCents = monthlyCentsFor(effectiveTag);

  await db
    .update(workspaceSubscriptions)
    .set({
      planTag: effectiveTag,
      planAmount: effectiveTag === "Free" ? "Free" : `$${monthlyCents / 100}`,
      planPeriod: effectiveTag === "Free" ? "forever!" : "per month",
      monthlyCents,
      status: input.active ? "Active" : "Inactive",
      billingOwner: input.active ? "Shopify" : "none",
      shopifySubscriptionId: input.shopifySubscriptionId ?? null,
    })
    .where(eq(workspaceSubscriptions.workspaceId, input.workspaceId));

  await db
    .update(workspaces)
    .set(planFeatureFlags(effectiveTag))
    .where(eq(workspaces.id, input.workspaceId));

  const workspace = await selectOne(
    db.select().from(workspaces).where(eq(workspaces.id, input.workspaceId)),
  );
  const subscription = await selectOne(
    db
      .select()
      .from(workspaceSubscriptions)
      .where(eq(workspaceSubscriptions.workspaceId, input.workspaceId)),
  );
  if (!workspace || !subscription) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, plan: toWorkspacePlan(workspace, subscription) };
}
