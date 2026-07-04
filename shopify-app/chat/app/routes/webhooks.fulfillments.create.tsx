import type { ActionFunctionArgs } from "react-router";
import { authenticate, unauthenticated } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import { getShopLink } from "../lib/shop-link.server";
import { applyShopifyOrderToMainApp } from "../lib/bybelt-main.server";
import { fetchShopifyOrderContext } from "../lib/shopify-refund-order.server";

type FulfillmentWebhookPayload = {
  order_id?: number | string | null;
  tracking_number?: string | null;
  tracking_company?: string | null;
  status?: string | null;
};

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const link = await getShopLink(shop);
  if (!link) {
    return new Response();
  }

  const fulfillment = payload as FulfillmentWebhookPayload;
  const orderId = fulfillment.order_id;
  if (orderId == null) {
    return new Response();
  }

  const { admin } = await unauthenticated.admin(link.shop);
  const order = await fetchShopifyOrderContext(admin, orderId);
  if (!order) {
    return new Response();
  }

  const trackingParts = [fulfillment.tracking_company, fulfillment.tracking_number]
    .map((value) => value?.trim())
    .filter(Boolean);
  const orderDetail =
    trackingParts.length > 0
      ? `${order.orderName} · ${trackingParts.join(" ")}`
      : order.orderName;

  await applyShopifyOrderToMainApp(link.workspaceId, order.email, order.orderName, orderDetail, {
    note: "fulfilled",
    shop: link.shop,
    orderStatus: "fulfilled",
  });

  return new Response();
});
