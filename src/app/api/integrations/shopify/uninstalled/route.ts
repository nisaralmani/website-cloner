import { NextResponse } from "next/server";
import { isValidInternalSecret, unauthorizedInternal } from "@/lib/auth/internal-request";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";
import { getDb } from "@/db/client";

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

  return NextResponse.json({ ok: true });
}
