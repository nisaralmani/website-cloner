import { NextResponse } from "next/server";
import { isValidInternalSecret, unauthorizedInternal } from "@/lib/auth/internal-request";
import { getDb } from "@/db/client";
import { applyShopifyPlan } from "@/lib/billing/apply-shopify-plan";

/**
 * Internal endpoint called by the Shopify app's `app_subscriptions/update`
 * webhook. This is the single source of truth for activating a paid plan — no
 * user-facing route may set an active paid subscription.
 */
export async function POST(request: Request) {
  if (!isValidInternalSecret(request)) {
    return unauthorizedInternal();
  }

  let body: {
    workspaceId?: string;
    planTag?: string;
    status?: string;
    shopifySubscriptionId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  const planTag = body.planTag?.trim();
  if (!workspaceId || !planTag) {
    return NextResponse.json(
      { error: "workspaceId and planTag are required" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const result = await applyShopifyPlan(db, {
    workspaceId,
    planTag,
    active: body.status?.trim().toUpperCase() === "ACTIVE",
    shopifySubscriptionId: body.shopifySubscriptionId ?? null,
  });

  if (!result.ok) {
    if ("reason" in result && result.reason === "not_found") {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ plan: result.plan });
}
