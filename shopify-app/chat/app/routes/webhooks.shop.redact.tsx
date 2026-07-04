import { randomUUID } from "node:crypto";
import type { ActionFunctionArgs } from "react-router";
import { authenticate, sessionStorage } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import db from "../db.server";
import { getShopLink } from "../lib/shop-link.server";
import {
  notifyMainAppShopifyUninstalled,
  redactMainAppShopifyShop,
} from "../lib/bybelt-main.server";
import {
  auditGdprReceived,
  auditGdprSkipped,
  runGdprBridgeOp,
} from "../lib/gdpr-audit.server";

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { shop } = await authenticate.webhook(request);
  const requestId = randomUUID();

  const link = await getShopLink(shop);
  const ctx = {
    event: "shop_redact" as const,
    shop,
    workspaceId: link?.workspaceId ?? null,
  };
  auditGdprReceived(ctx);

  if (link) {
    // Erase shop-scoped data in the main app, then notify uninstall. Both run
    // through the audited/retryable bridge path; a failure re-throws so Shopify
    // re-delivers this compliance webhook.
    await runGdprBridgeOp(ctx, requestId, async () => {
      await redactMainAppShopifyShop(link.workspaceId, shop, requestId);
      await notifyMainAppShopifyUninstalled(link.workspaceId, shop);
    });
  } else {
    auditGdprSkipped(ctx, "no_shop_link");
  }

  // Local cleanup is best-effort and idempotent; it runs regardless of link
  // state so no Shopify session/token survives a shop redact.
  const sessions = await sessionStorage.findSessionsByShop(shop);
  await Promise.all(sessions.map((session) => sessionStorage.deleteSession(session.id)));
  await db.shopLink.deleteMany({ where: { shop } }).catch(() => undefined);

  return new Response();
});
