import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request";
import { buildChatboxEmbedSnippet } from "@/lib/chatbox/embed-snippet";
import { fetchShopifyWorkspaceStatus } from "@/lib/integrations/shopify-context";
import {
  WORKSPACE_INTEGRATION_CATEGORIES,
  WORKSPACE_INTEGRATIONS_FOOTER_BUTTON,
  WORKSPACE_INTEGRATIONS_INTRO,
} from "@/lib/workspaces/integrations-catalog";

const SHOPIFY_PLUGIN_BASE = "https://chat.bybelt.com/initiate/plugin/shopify";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const embed = buildChatboxEmbedSnippet(origin, {
    id: session.workspace.id,
    domain: session.workspace.domain,
  });

  const shopifyStatus = await fetchShopifyWorkspaceStatus(session.workspace.id);

  return NextResponse.json({
    workspaceId: session.workspace.id,
    intro: WORKSPACE_INTEGRATIONS_INTRO,
    footerButton: WORKSPACE_INTEGRATIONS_FOOTER_BUTTON,
    categories: WORKSPACE_INTEGRATION_CATEGORIES,
    htmlSnippet: embed.htmlSnippet,
    scriptUrl: embed.scriptUrl,
    shopify: {
      installUrl: SHOPIFY_PLUGIN_BASE,
      linked: shopifyStatus?.linked ?? false,
      shop: shopifyStatus?.shop,
      shopAdminUrl: shopifyStatus?.shopAdminUrl,
      widgetEnabled: shopifyStatus?.widgetEnabled,
      lastContactSyncAt: shopifyStatus?.lastContactSyncAt,
      lastContactSyncCreated: shopifyStatus?.lastContactSyncCreated,
      lastContactSyncUpdated: shopifyStatus?.lastContactSyncUpdated,
      lastContactSyncTotal: shopifyStatus?.lastContactSyncTotal,
      webhookTopicCount: shopifyStatus?.webhookTopicCount,
    },
  });
}
