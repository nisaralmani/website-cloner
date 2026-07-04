import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import { getShopLink } from "../lib/shop-link.server";
import { redactMainAppShopifyCustomer } from "../lib/bybelt-main.server";
import { fetchCustomerEmailForWebhook } from "../lib/shopify-customer.server";

type CustomerDeletePayload = {
  id?: number | string | null;
  email?: string | null;
};

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const link = await getShopLink(shop);
  if (!link) {
    return new Response();
  }

  const body = payload as CustomerDeletePayload;
  let email = body.email?.trim();
  if (!email && body.id != null) {
    email = await fetchCustomerEmailForWebhook(link.shop, body.id);
  }
  if (!email) {
    return new Response();
  }

  await redactMainAppShopifyCustomer(link.workspaceId, email, "delete");

  return new Response();
});
