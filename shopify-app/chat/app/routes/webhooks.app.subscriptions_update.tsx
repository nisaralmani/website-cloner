import type { ActionFunctionArgs } from "react-router";
import { SessionNotFoundError } from "@shopify/shopify-app-react-router/server";
import { authenticate, unauthenticated } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import { getShopLink } from "../lib/shop-link.server";
import { reconcileWorkspaceBillingFromShopify } from "../lib/billing-reconcile.server";

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const link = await getShopLink(shop);
  if (!link) {
    return new Response();
  }

  // Source of truth is Shopify's live subscription list, not this payload's
  // status. Re-reading makes the outcome order-independent: whichever of the
  // paired CANCELLED (old plan) / ACTIVE (new plan) webhooks lands last, the
  // workspace converges to the truly-active plan instead of being clobbered to
  // Free. unauthenticated.admin can throw when the offline token is missing or
  // expired — in that case there is nothing to retry usefully, so we ack the
  // delivery (return 200) and let the periodic reconciliation sweep repair it.
  let admin: Awaited<ReturnType<typeof unauthenticated.admin>>["admin"];
  try {
    ({ admin } = await unauthenticated.admin(shop));
  } catch (error) {
    const isExpiredToken =
      error instanceof Response && error.status === 500 && !error.bodyUsed;
    const isSessionMissing = error instanceof SessionNotFoundError;
    if (isExpiredToken || isSessionMissing) {
      console.warn(`app_subscriptions/update: no usable session for ${shop}; deferring to reconcile`);
      return new Response();
    }
    throw error;
  }

  // A bridge failure throws, yielding a non-2xx so Shopify retries the delivery.
  await reconcileWorkspaceBillingFromShopify(admin, shop, link.workspaceId);

  return new Response();
});
