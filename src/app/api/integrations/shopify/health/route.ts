import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request";
import { fetchLinkedShopifyWorkspaceIds } from "@/lib/integrations/shopify-sync-status";
import { fetchShopifyWorkspaceStatus } from "@/lib/integrations/shopify-context";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await fetchShopifyWorkspaceStatus(session.workspace.id);
  const linkedWorkspaces = await fetchLinkedShopifyWorkspaceIds();

  return NextResponse.json({
    ok: true,
    bridgeConfigured: status != null,
    linked: status?.linked ?? false,
    shop: status?.shop ?? null,
    webhookTopicCount: status?.webhookTopicCount ?? null,
    linkedWorkspaces: linkedWorkspaces?.length ?? null,
    lastContactSyncAt: status?.lastContactSyncAt ?? null,
  });
}
