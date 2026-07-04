import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { webhookLoader } from "../lib/webhook-route.server";
import { withWebhookTelemetry } from "../lib/webhook-telemetry.server";
import db from "../db.server";

export const loader = webhookLoader;

export const action = withWebhookTelemetry(async ({ request }: ActionFunctionArgs) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = payload.current as string[];
  if (session) {
    await db.session.updateMany({
      where: { id: session.id },
      data: { scope: current.toString() },
    });
  }
  return new Response();
});
