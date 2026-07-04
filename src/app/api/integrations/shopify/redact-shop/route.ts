import { NextResponse } from "next/server";

import { getDb } from "@/db/client";

import { isValidInternalSecret, unauthorizedInternal } from "@/lib/auth/internal-request";

import { redactShopifyWorkspaceData } from "@/lib/integrations/shopify-redact";

import { publishConversationUpdated } from "@/lib/inbox/event-bus";

import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";

import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";



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

  const result = await redactShopifyWorkspaceData(db, workspaceId);



  const conversationList = await fetchWorkspaceConversations(workspaceId);

  publishConversationUpdated(workspaceId, conversationList);



  void deliverWorkspaceWebhooks(db, workspaceId, "integration:shopify_redact", {

    scope: "workspace",

    shop: body.shop?.trim() ?? null,

    ...result,

  });



  return NextResponse.json({ ok: true, shop: body.shop?.trim() ?? null, ...result });

}


