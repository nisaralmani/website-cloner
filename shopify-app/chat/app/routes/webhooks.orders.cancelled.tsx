import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import { getShopLink } from "../lib/shop-link.server";
import { applyShopifyOrderToMainApp } from "../lib/bybelt-main.server";
import { formatShopifyOrderProducts } from "../lib/shopify-order-products.server";
import {
  formatShopifyOrderStatus,
  orderEmailFromPayload,
  type ShopifyOrderWebhookPayload,
} from "../lib/shopify-order-webhook.server";

type OrderCancelledPayload = ShopifyOrderWebhookPayload & {
  cancel_reason?: string | null;
};

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const link = await getShopLink(shop);
  if (!link) {
    return new Response();
  }

  const order = payload as OrderCancelledPayload;
  const email = orderEmailFromPayload(order);
  const orderName = order.name?.trim();
  if (!email || !orderName) {
    return new Response();
  }

  const reason = order.cancel_reason?.trim().replace(/_/g, " ");
  const orderDetail =
    order.total_price && order.currency
      ? `${orderName} · ${order.total_price} ${order.currency}${reason ? ` · ${reason}` : ""}`
      : orderName;

  await applyShopifyOrderToMainApp(link.workspaceId, email, orderName, orderDetail, {
    note: "cancelled",
    products: formatShopifyOrderProducts(order.line_items),
    shop: link.shop,
    orderStatus: formatShopifyOrderStatus(order.financial_status, order.fulfillment_status) ?? "cancelled",
  });

  return new Response();
});
