import type { ActionFunctionArgs } from "react-router";

/**
 * Reusable webhook telemetry (Phase 20 — Task 5).
 *
 * Wraps any Shopify webhook action to record — without a dashboard — the six
 * required signals: received, processed, failed, retried, duration, and
 * duplicate deliveries. Counters are in-memory (per process) and every delivery
 * also emits a structured JSON log line so the data survives in log aggregation.
 *
 * Design constraints (Phase 20): no new database table, no queue, no background
 * worker. Duplicate/retry detection uses a bounded in-memory LRU of recently
 * seen `X-Shopify-Webhook-Id` values — best-effort across restarts, which is all
 * telemetry requires (processing idempotency is enforced separately by the
 * upsert-based bridge operations).
 */

export type WebhookMeta = {
  topic: string;
  shop: string;
  webhookId: string;
  triggeredAt: string | null;
};

export type WebhookMetricsSnapshot = {
  received: number;
  processed: number;
  failed: number;
  retried: number;
  duplicates: number;
  /** Rolling average processing duration in milliseconds. */
  avgDurationMs: number;
  /** Max processing duration observed in milliseconds. */
  maxDurationMs: number;
  byTopic: Record<
    string,
    { received: number; processed: number; failed: number; duplicates: number }
  >;
};

const metrics = {
  received: 0,
  processed: 0,
  failed: 0,
  retried: 0,
  duplicates: 0,
  totalDurationMs: 0,
  durationSamples: 0,
  maxDurationMs: 0,
  byTopic: new Map<
    string,
    { received: number; processed: number; failed: number; duplicates: number }
  >(),
};

// Bounded LRU of recently seen webhook ids -> whether the last attempt failed.
const SEEN_CAPACITY = 5_000;
const seenDeliveries = new Map<string, { failed: boolean }>();

function touchSeen(webhookId: string): { seenBefore: boolean; previouslyFailed: boolean } {
  if (!webhookId) return { seenBefore: false, previouslyFailed: false };
  const existing = seenDeliveries.get(webhookId);
  if (existing) {
    // Refresh recency (delete + re-set moves it to the end of insertion order).
    seenDeliveries.delete(webhookId);
    seenDeliveries.set(webhookId, existing);
    return { seenBefore: true, previouslyFailed: existing.failed };
  }
  seenDeliveries.set(webhookId, { failed: false });
  if (seenDeliveries.size > SEEN_CAPACITY) {
    const oldest = seenDeliveries.keys().next().value;
    if (oldest !== undefined) seenDeliveries.delete(oldest);
  }
  return { seenBefore: false, previouslyFailed: false };
}

function markSeenOutcome(webhookId: string, failed: boolean): void {
  if (!webhookId) return;
  const existing = seenDeliveries.get(webhookId);
  if (existing) existing.failed = failed;
}

function topicBucket(topic: string) {
  let bucket = metrics.byTopic.get(topic);
  if (!bucket) {
    bucket = { received: 0, processed: 0, failed: 0, duplicates: 0 };
    metrics.byTopic.set(topic, bucket);
  }
  return bucket;
}

function readMeta(request: Request): WebhookMeta {
  return {
    topic: request.headers.get("X-Shopify-Topic") ?? "unknown",
    shop: request.headers.get("X-Shopify-Shop-Domain") ?? "unknown",
    webhookId: request.headers.get("X-Shopify-Webhook-Id") ?? "",
    triggeredAt: request.headers.get("X-Shopify-Triggered-At"),
  };
}

function log(
  level: "info" | "warn" | "error",
  fields: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    component: "webhook-telemetry",
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/**
 * Wrap a webhook action with telemetry. Behaviour-preserving: the wrapped
 * handler's Response is returned unchanged, and any thrown error/Response is
 * re-thrown so Shopify's retry semantics are unaffected.
 */
export function withWebhookTelemetry(
  handler: (args: ActionFunctionArgs) => Promise<Response>,
): (args: ActionFunctionArgs) => Promise<Response> {
  return async (args: ActionFunctionArgs): Promise<Response> => {
    const meta = readMeta(args.request);
    const bucket = topicBucket(meta.topic);
    const startedAt = Date.now();

    const { seenBefore, previouslyFailed } = touchSeen(meta.webhookId);
    metrics.received += 1;
    bucket.received += 1;
    if (seenBefore) {
      metrics.duplicates += 1;
      bucket.duplicates += 1;
    }
    if (seenBefore && previouslyFailed) {
      metrics.retried += 1;
    }

    log("info", {
      event: "webhook_received",
      topic: meta.topic,
      shop: meta.shop,
      webhookId: meta.webhookId || undefined,
      duplicate: seenBefore,
      retry: seenBefore && previouslyFailed,
    });

    try {
      const response = await handler(args);
      const durationMs = Date.now() - startedAt;
      metrics.processed += 1;
      bucket.processed += 1;
      metrics.totalDurationMs += durationMs;
      metrics.durationSamples += 1;
      if (durationMs > metrics.maxDurationMs) metrics.maxDurationMs = durationMs;
      markSeenOutcome(meta.webhookId, false);
      log("info", {
        event: "webhook_processed",
        topic: meta.topic,
        shop: meta.shop,
        webhookId: meta.webhookId || undefined,
        durationMs,
        status: response.status,
      });
      return response;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      metrics.failed += 1;
      bucket.failed += 1;
      markSeenOutcome(meta.webhookId, true);
      log("error", {
        event: "webhook_failed",
        topic: meta.topic,
        shop: meta.shop,
        webhookId: meta.webhookId || undefined,
        durationMs,
        errorType: error instanceof Error ? error.name : typeof error,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };
}

/** Point-in-time snapshot of webhook metrics (for the internal health route). */
export function getWebhookMetrics(): WebhookMetricsSnapshot {
  const byTopic: WebhookMetricsSnapshot["byTopic"] = {};
  for (const [topic, bucket] of metrics.byTopic) {
    byTopic[topic] = { ...bucket };
  }
  return {
    received: metrics.received,
    processed: metrics.processed,
    failed: metrics.failed,
    retried: metrics.retried,
    duplicates: metrics.duplicates,
    avgDurationMs:
      metrics.durationSamples > 0
        ? Math.round(metrics.totalDurationMs / metrics.durationSamples)
        : 0,
    maxDurationMs: metrics.maxDurationMs,
    byTopic,
  };
}
