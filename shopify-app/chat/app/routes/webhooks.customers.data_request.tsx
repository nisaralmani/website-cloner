import { randomUUID } from "node:crypto";
import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import { getShopLink } from "../lib/shop-link.server";
import { notifyMainAppShopifyDataRequest } from "../lib/bybelt-main.server";
import {
  auditGdprReceived,
  auditGdprSkipped,
  runGdprBridgeOp,
} from "../lib/gdpr-audit.server";

type CustomerDataRequestPayload = {
  customer?: {
    email?: string | null;
  } | null;
};

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop, payload } = await authenticate.webhook(request);
  const requestId = randomUUID();

  const link = await getShopLink(shop);
  const email = (payload as CustomerDataRequestPayload).customer?.email?.trim() ?? null;
  const ctx = {
    event: "customers_data_request" as const,
    shop,
    workspaceId: link?.workspaceId ?? null,
    email,
  };
  auditGdprReceived(ctx);

  if (!link) {
    auditGdprSkipped(ctx, "no_shop_link");
    return new Response();
  }

  await runGdprBridgeOp(ctx, requestId, () =>
    notifyMainAppShopifyDataRequest(link.workspaceId, shop, email ?? undefined, requestId),
  );

  return new Response();
});
