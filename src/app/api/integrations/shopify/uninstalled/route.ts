import { NextResponse } from "next/server";
import { isValidInternalSecret, unauthorizedInternal } from "@/lib/auth/internal-request";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";
import { getDb } from "@/db/client";
import { applyShopifyPlan } from "@/lib/billing/apply-shopify-plan";

export async function POST(request: Request) {
  if (!isValidInternalSecret(request)) {
    return unauthorizedInternal();
  }

  let body: { workspaceId?: string; shop?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const db = await getDb();
  void deliverWorkspaceWebhooks(db, workspaceId, "integration:shopify_uninstalled", {
    shop: body.shop?.trim() ?? null,
  });

  // Uninstalling the Shopify app removes billing entirely — there is no longer a
  // subscription backing this workspace. Shopify is the source of truth, so
  // revoke the plan immediately (this also clears premium feature flags). The
  // reconcile sweep cannot cover this case because the Shopify app deletes the
  // ShopLink on uninstall. Idempotent; a not-found workspace is a no-op.
  await applyShopifyPlan(db, {
    workspaceId,
    planTag: "Free",
    active: false,
    shopifySubscriptionId: null,
  });

  return NextResponse.json({ ok: true });
}
