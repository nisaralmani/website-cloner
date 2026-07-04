import { randomUUID } from "node:crypto";
import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import { getShopLink } from "../lib/shop-link.server";
import { redactMainAppShopifyCustomer } from "../lib/bybelt-main.server";
import {
  auditGdprReceived,
  auditGdprSkipped,
  runGdprBridgeOp,
} from "../lib/gdpr-audit.server";

type CustomerRedactPayload = {
  customer?: {
    email?: string | null;
  } | null;
};

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop, payload } = await authenticate.webhook(request);
  const requestId = randomUUID();

  const link = await getShopLink(shop);
  const email = (payload as CustomerRedactPayload).customer?.email?.trim() ?? null;
  const ctx = {
    event: "customers_redact" as const,
    shop,
    workspaceId: link?.workspaceId ?? null,
    email,
  };
  auditGdprReceived(ctx);

  if (!link) {
    // No tenant link for this shop — there is no Bybelt-side data to erase.
    auditGdprSkipped(ctx, "no_shop_link");
    return new Response();
  }
  if (!email) {
    auditGdprSkipped(ctx, "no_customer_email_in_payload");
    return new Response();
  }

  await runGdprBridgeOp(ctx, requestId, () =>
    redactMainAppShopifyCustomer(link.workspaceId, email, "gdpr", requestId),
  );

  return new Response();
});
