import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import db from "../db.server";
import { getShopLink } from "../lib/shop-link.server";

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  const link = await getShopLink(shop);
  if (link) {
    const { notifyMainAppShopifyUninstalled } = await import("../lib/bybelt-main.server");
    await notifyMainAppShopifyUninstalled(link.workspaceId, shop);
  }

  await db.shopLink.deleteMany({ where: { shop } }).catch(() => undefined);

  return new Response();
});
