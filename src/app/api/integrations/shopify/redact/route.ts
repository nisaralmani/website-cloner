import { NextResponse } from "next/server";

import { getDb } from "@/db/client";

import { isValidInternalSecret, unauthorizedInternal } from "@/lib/auth/internal-request";

import { redactShopifyCustomerData } from "@/lib/integrations/shopify-redact";

import { publishConversationUpdated } from "@/lib/inbox/event-bus";

import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";

import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";



export async function POST(request: Request) {

  if (!isValidInternalSecret(request)) {

    return unauthorizedInternal();

  }



  let body: { workspaceId?: string; email?: string; source?: "gdpr" | "delete" };

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

  const result = await redactShopifyCustomerData(db, workspaceId, email);



  if (result.conversationsCleared > 0) {

    const conversationList = await fetchWorkspaceConversations(workspaceId);

    publishConversationUpdated(workspaceId, conversationList);

  }



  const event =

    body.source === "delete" ? "integration:shopify_delete" : "integration:shopify_redact";

  void deliverWorkspaceWebhooks(db, workspaceId, event, {

    email,

    source: body.source ?? "gdpr",

    contactsDeleted: result.contactsDeleted,

    conversationsCleared: result.conversationsCleared,

    visitorDataRemoved: result.visitorDataRemoved,

  });



  return NextResponse.json({ ok: true, ...result });

}


