export type WebhookEvent =
  | "message:operator"
  | "message:visitor"
  | "message:note"
  | "conversation:status"
  | "conversation:assigned"
  | "conversation:created"
  | "conversation:deleted"
  | "campaign:sent"
  | "integration:shopify_uninstalled"
  | "integration:shopify_linked"
  | "integration:shopify_order"
  | "integration:shopify_customer"
  | "integration:shopify_data_request"
  | "integration:shopify_refund"
  | "integration:shopify_fulfilled"
  | "integration:shopify_cancelled"
  | "integration:shopify_paid"
  | "integration:shopify_sync"
  | "integration:shopify_redact"
  | "integration:shopify_delete";

export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = [
  "message:operator",
  "message:visitor",
  "message:note",
  "conversation:status",
  "conversation:assigned",
  "conversation:created",
  "conversation:deleted",
  "campaign:sent",
  "integration:shopify_uninstalled",
  "integration:shopify_linked",
  "integration:shopify_order",
  "integration:shopify_customer",
  "integration:shopify_data_request",
  "integration:shopify_refund",
  "integration:shopify_fulfilled",
  "integration:shopify_cancelled",
  "integration:shopify_paid",
  "integration:shopify_sync",
  "integration:shopify_redact",
  "integration:shopify_delete",
];

export function parseWebhookEvents(value: string | null | undefined): WebhookEvent[] {
  if (!value) {
    return ALL_WEBHOOK_EVENTS;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return ALL_WEBHOOK_EVENTS;
    }
    return parsed.filter((item): item is WebhookEvent =>
      typeof item === "string" && ALL_WEBHOOK_EVENTS.includes(item as WebhookEvent),
    );
  } catch {
    return ALL_WEBHOOK_EVENTS;
  }
}

export function serializeWebhookEvents(events: WebhookEvent[]) {
  return JSON.stringify(events.length > 0 ? events : ALL_WEBHOOK_EVENTS);
}

const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  "message:operator": "Operator message",
  "message:visitor": "Visitor message",
  "message:note": "Internal note",
  "conversation:status": "Conversation status",
  "conversation:assigned": "Conversation assigned",
  "conversation:created": "Conversation created",
  "conversation:deleted": "Conversation deleted",
  "campaign:sent": "Campaign sent",
  "integration:shopify_linked": "Shopify store linked",
  "integration:shopify_uninstalled": "Shopify app uninstalled",
  "integration:shopify_order": "Shopify order",
  "integration:shopify_customer": "Shopify customer",
  "integration:shopify_data_request": "Shopify GDPR data request",
  "integration:shopify_refund": "Shopify refund",
  "integration:shopify_fulfilled": "Shopify fulfillment",
  "integration:shopify_cancelled": "Shopify order cancelled",
  "integration:shopify_paid": "Shopify order paid",
  "integration:shopify_sync": "Shopify contact sync",
  "integration:shopify_redact": "Shopify data redacted",
  "integration:shopify_delete": "Shopify customer deleted",
};

export function formatWebhookEventLabel(event: string): string {
  if (event in WEBHOOK_EVENT_LABELS) {
    return WEBHOOK_EVENT_LABELS[event as WebhookEvent];
  }
  return event;
}

export function shopifyOrderWorkspaceWebhookEvent(
  note?: "create" | "update" | "cancelled" | "paid" | "refund" | "fulfilled" | false,
): Extract<
  WebhookEvent,
  | "integration:shopify_order"
  | "integration:shopify_refund"
  | "integration:shopify_fulfilled"
  | "integration:shopify_cancelled"
  | "integration:shopify_paid"
> {
  if (note === "refund") return "integration:shopify_refund";
  if (note === "fulfilled") return "integration:shopify_fulfilled";
  if (note === "cancelled") return "integration:shopify_cancelled";
  if (note === "paid") return "integration:shopify_paid";
  return "integration:shopify_order";
}
