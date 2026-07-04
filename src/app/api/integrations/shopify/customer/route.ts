import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { isValidInternalSecret, unauthorizedInternal } from "@/lib/auth/internal-request";
import { applyShopifyCustomerToConversations } from "@/lib/inbox/shopify-conversation";
import { publishConversationUpdated } from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";

export async function PUT(request: Request) {
  if (!isValidInternalSecret(request)) {
    return unauthorizedInternal();
  }

  let body: {
    workspaceId?: string;
    email?: string;
    location?: string;
    phone?: string;
    customerId?: string;
    totalSpent?: string;
    orderCount?: string;
    tags?: string;
    shop?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  const email = body.email?.trim();
  if (!workspaceId || !email) {
    return NextResponse.json({ error: "workspaceId and email are required" }, { status: 400 });
  }

  const db = await getDb();
  const conversationsUpdated = await applyShopifyCustomerToConversations(db, workspaceId, email, {
    location: body.location,
    phone: body.phone,
    customerId: body.customerId,
    totalSpent: body.totalSpent,
    orderCount: body.orderCount,
    tags: body.tags,
    shop: body.shop,
  });

  if (conversationsUpdated > 0) {
    const conversationList = await fetchWorkspaceConversations(workspaceId);
    publishConversationUpdated(workspaceId, conversationList);
  }

  void deliverWorkspaceWebhooks(db, workspaceId, "integration:shopify_customer", {
    email,
    customerId: body.customerId ?? null,
    conversationsUpdated,
  });

  return NextResponse.json({ conversationsUpdated });
}
