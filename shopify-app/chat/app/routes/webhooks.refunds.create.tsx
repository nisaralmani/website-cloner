import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import { getShopLink } from "../lib/shop-link.server";
import { unauthenticated } from "../shopify.server";
import { applyShopifyOrderToMainApp } from "../lib/bybelt-main.server";
import { fetchShopifyOrderContext } from "../lib/shopify-refund-order.server";

type RefundWebhookPayload = {
  order_id?: number | string | null;
  note?: string | null;
};

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const link = await getShopLink(shop);
  if (!link) {
    return new Response();
  }

  const refund = payload as RefundWebhookPayload;
  const orderId = refund.order_id;
  if (orderId == null) {
    return new Response();
  }

  const { admin } = await unauthenticated.admin(link.shop);
  const order = await fetchShopifyOrderContext(admin, orderId);
  if (!order) {
    return new Response();
  }

  const note = refund.note?.trim();
  const orderDetail = note ? `${order.orderName} · ${note}` : order.orderName;

  await applyShopifyOrderToMainApp(link.workspaceId, order.email, order.orderName, orderDetail, {
    note: "refund",
    shop: link.shop,
  });

  return new Response();
});
