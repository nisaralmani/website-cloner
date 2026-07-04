import { asc, eq } from "drizzle-orm";

import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { workspaceWebhooks } from "@/db/schema";
import { toBooleanFlag } from "@/lib/auth/flags";
import { runJob } from "@/lib/jobs/runner";
import { createComponentLogger } from "@/lib/logging/logger";
import { CIRCUITS } from "@/lib/reliability/circuit-breaker";
import { parseWebhookEvents, type WebhookEvent } from "@/lib/workspaces/webhook-events";

const log = createComponentLogger("workspaces:webhook-delivery");

export type { WebhookEvent };

const DELIVERY_TIMEOUT_MS = 5_000;

/**
 * Per-endpoint circuit breaker name. Keyed by URL (not a single shared breaker)
 * so one consistently-failing customer endpoint short-circuits on its own
 * without affecting delivery to healthy endpoints.
 */
function webhookCircuit(url: string): string {
  return `${CIRCUITS.webhooks}:${url}`;
}

/**
 * Deliver a workspace event to every subscribed outbound webhook.
 *
 * Phase 24C: each delivery now runs through {@link runJob} so it is tracked for
 * graceful shutdown, timed, classified, logged, and metered. Delivery behavior
 * is unchanged — best-effort, concurrent, single attempt (no retry), failures
 * do not throw. `AbortSignal.timeout` still bounds each request at 5s; the job's
 * cancellation signal additionally aborts the request on shutdown drain.
 *
 * Every call site treats this as a fire-and-forget side effect
 * (`void deliverWorkspaceWebhooks(...)`, no `.catch()`) — so the lookup of
 * which webhooks are subscribed must never throw either, or a transient DB
 * hiccup during an ordinary request (send message, delete conversation, etc.)
 * becomes an unhandled promise rejection and crashes the process.
 */
export async function deliverWorkspaceWebhooks(
  db: AppDatabase,
  workspaceId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
) {
  let rows;
  try {
    rows = await selectAll(
      db
        .select()
        .from(workspaceWebhooks)
        .where(eq(workspaceWebhooks.workspaceId, workspaceId))
        .orderBy(asc(workspaceWebhooks.createdAt)),
    );
  } catch (error) {
    log.warn("webhook_subscription_lookup_failed", {
      workspaceId,
      event,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const enabled = rows.filter((row) => {
    if (!toBooleanFlag(row.enabled)) {
      return false;
    }
    const events = parseWebhookEvents(row.events);
    return events.includes(event);
  });

  if (enabled.length === 0) {
    return;
  }

  const body = JSON.stringify({
    event,
    workspaceId,
    timestamp: new Date().toISOString(),
    ...payload,
  });

  await Promise.all(
    enabled.map((row) =>
      runJob(
        "workspace.webhook-delivery",
        async (ctx) => {
          const response = await fetch(row.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "bybelt-webhooks/1.0",
            },
            body,
            signal: AbortSignal.any([
              AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
              ctx.signal,
            ]),
          });
          return response.status;
        },
        {
          correlation: { workspaceId },
          // Best-effort delivery: single attempt, failures are expected and
          // must not surface to the error tracker (metrics still record them).
          captureErrors: false,
          // Phase 24D: a repeatedly-failing endpoint trips its own breaker and
          // short-circuits further deliveries until it recovers.
          circuit: webhookCircuit(row.url),
        },
      ),
    ),
  );
}

export async function deliverWebhookTest(
  db: AppDatabase,
  workspaceId: string,
  webhookId: string,
) {
  const rows = await selectAll(
    db
      .select()
      .from(workspaceWebhooks)
      .where(eq(workspaceWebhooks.workspaceId, workspaceId)),
  );

  const row = rows.find((item) => item.id === webhookId);
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const body = JSON.stringify({
    event: "webhook:test",
    workspaceId,
    timestamp: new Date().toISOString(),
    message: "Bybelt webhook test delivery",
    integrationEvents: [
      "integration:shopify_order",
      "integration:shopify_customer",
      "integration:shopify_sync",
      "integration:shopify_redact",
      "integration:shopify_delete",
    ],
  });

  const result = await runJob(
    "workspace.webhook-test",
    async (ctx) => {
      const response = await fetch(row.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "bybelt-webhooks/1.0",
        },
        body,
        signal: AbortSignal.any([
          AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
          ctx.signal,
        ]),
      });
      return response.status;
    },
    {
      correlation: { workspaceId },
      captureErrors: false,
      circuit: webhookCircuit(row.url),
    },
  );

  if (result.ok) {
    return { ok: true as const, status: result.value };
  }
  return { ok: false as const, error: "Webhook delivery failed" };
}
