import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { isValidInternalSecret, unauthorizedInternal } from "@/lib/auth/internal-request";
import {
  applyShopifyOrderToConversations,
  loadShopifyOrderNoteMessages,
} from "@/lib/inbox/shopify-conversation";
import {
  publishConversationUpdated,
  publishMessageCreated,
} from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";
import { shopifyOrderWorkspaceWebhookEvent } from "@/lib/workspaces/webhook-events";

export async function PUT(request: Request) {
  if (!isValidInternalSecret(request)) {
    return unauthorizedInternal();
  }

  let body: {
    workspaceId?: string;
    email?: string;
    orderName?: string;
    orderDetail?: string;
    note?: "create" | "update" | "cancelled" | "paid" | "refund" | "fulfilled" | false;
    products?: string;
    shop?: string;
    orderStatus?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  const email = body.email?.trim();
  const orderName = body.orderName?.trim();
  if (!workspaceId || !email || !orderName) {
    return NextResponse.json(
      { error: "workspaceId, email, and orderName are required" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const result = await applyShopifyOrderToConversations(
    db,
    workspaceId,
    email,
    orderName,
    body.orderDetail,
    {
      note: body.note,
      products: body.products,
      shop: body.shop,
      orderStatus: body.orderStatus,
    },
  );

  if (result.noteEvents.length > 0) {
    const messageIds = result.noteEvents.map((event) => event.messageId);
    const apiMessages = await loadShopifyOrderNoteMessages(db, messageIds);
    const byId = new Map(apiMessages.map((message) => [message.id, message]));
    const byConversation = new Map<string, typeof apiMessages>();
    for (const event of result.noteEvents) {
      const message = byId.get(event.messageId);
      if (!message) continue;
      const list = byConversation.get(event.conversationId) ?? [];
      list.push(message);
      byConversation.set(event.conversationId, list);
    }
    for (const [conversationId, noteMessages] of byConversation) {
      publishMessageCreated(workspaceId, conversationId, noteMessages);
    }
  }

  if (result.conversationsUpdated > 0) {
    const conversationList = await fetchWorkspaceConversations(workspaceId);
    publishConversationUpdated(workspaceId, conversationList);
  }

  void deliverWorkspaceWebhooks(
    db,
    workspaceId,
    shopifyOrderWorkspaceWebhookEvent(body.note),
    {
      email,
      orderName,
      orderDetail: body.orderDetail ?? null,
      noteKind: body.note ?? "create",
      conversationsUpdated: result.conversationsUpdated,
      notesCreated: result.notesCreated,
    },
  );

  return NextResponse.json({
    conversationsUpdated: result.conversationsUpdated,
    notesCreated: result.notesCreated,
  });
}
