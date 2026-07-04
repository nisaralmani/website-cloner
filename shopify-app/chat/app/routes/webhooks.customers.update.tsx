import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import { getShopLink } from "../lib/shop-link.server";
import {
  applyShopifyCustomerToMainApp,
  upsertMainAppShopifyContact,
} from "../lib/bybelt-main.server";
import { fetchCustomerWebhookEnrichment } from "../lib/shopify-customer.server";

type CustomerWebhookPayload = {
  id?: number | string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  default_address?: {
    city?: string | null;
    country?: string | null;
  } | null;
};

function customerFromPayload(customer: CustomerWebhookPayload) {
  const email = customer.email?.trim();
  if (!email) return null;

  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() || email;
  const location = customer.default_address
    ? [customer.default_address.city, customer.default_address.country]
        .filter(Boolean)
        .join(", ")
    : undefined;

  return {
    name,
    email,
    location: location || undefined,
    phone: customer.phone?.trim() || undefined,
    customerId: customer.id != null ? String(customer.id) : undefined,
    company: "Shopify",
  };
}

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const link = await getShopLink(shop);
  if (!link) {
    return new Response();
  }

  const customer = customerFromPayload(payload as CustomerWebhookPayload);
  if (!customer) {
    return new Response();
  }

  await upsertMainAppShopifyContact(link.workspaceId, customer);
  const enrichment = await fetchCustomerWebhookEnrichment(link.shop, customer.customerId);
  await applyShopifyCustomerToMainApp(link.workspaceId, customer.email, {
    location: customer.location,
    phone: customer.phone,
    customerId: customer.customerId,
    shop: link.shop,
    ...enrichment,
  });

  return new Response();
});
