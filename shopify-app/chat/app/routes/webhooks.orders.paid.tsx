import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import { getShopLink } from "../lib/shop-link.server";
import { applyShopifyOrderToMainApp } from "../lib/bybelt-main.server";
import { formatShopifyOrderProducts } from "../lib/shopify-order-products.server";
import {
  formatShopifyOrderStatus,
  orderDetailFromPayload,
  orderEmailFromPayload,
  type ShopifyOrderWebhookPayload,
} from "../lib/shopify-order-webhook.server";

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const link = await getShopLink(shop);
  if (!link) {
    return new Response();
  }

  const order = payload as ShopifyOrderWebhookPayload;
  const email = orderEmailFromPayload(order);
  const orderName = order.name?.trim();
  if (!email || !orderName) {
    return new Response();
  }

  await applyShopifyOrderToMainApp(
    link.workspaceId,
    email,
    orderName,
    orderDetailFromPayload(order) ?? orderName,
    {
      note: "paid",
      products: formatShopifyOrderProducts(order.line_items),
      shop: link.shop,
      orderStatus: formatShopifyOrderStatus(order.financial_status, order.fulfillment_status) ?? "paid",
    },
  );

  return new Response();
});
