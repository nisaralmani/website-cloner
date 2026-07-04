import type { LoaderFunctionArgs } from "react-router";
import {
  internalAuthFailure,
  verifyBybeltInternalRequest,
} from "../lib/internal-auth.server";
import { listLinkedWorkspaceIds } from "../lib/shop-link.server";
import { SHOPIFY_WEBHOOK_TOPIC_COUNT } from "../lib/shopify-webhooks.server";
import { getWebhookMetrics } from "../lib/webhook-telemetry.server";
import { countDeadLetters } from "../lib/dead-letter.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!verifyBybeltInternalRequest(request)) {
    return internalAuthFailure();
  }

  const workspaceIds = await listLinkedWorkspaceIds();
  const internalSecretConfigured = Boolean(process.env.BYBELT_INTERNAL_SECRET?.trim());
  const deadLetterCount = await countDeadLetters().catch(() => -1);

  return Response.json({
    ok: true,
    linkedWorkspaces: workspaceIds.length,
    internalSecretConfigured,
    webhookTopicCount: SHOPIFY_WEBHOOK_TOPIC_COUNT,
    // Phase 20 — reusable telemetry surfaced for observability (no dashboard).
    webhookMetrics: getWebhookMetrics(),
    deadLetterCount,
  });
};
