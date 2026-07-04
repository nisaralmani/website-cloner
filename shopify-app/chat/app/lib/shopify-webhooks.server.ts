export const SHOPIFY_WEBHOOK_TOPICS = [
  "app/uninstalled",
  "app/scopes_update",
  "customers/create",
  "customers/update",
  "customers/delete",
  "orders/create",
  "orders/updated",
  "orders/cancelled",
  "orders/paid",
  "refunds/create",
  "fulfillments/create",
  "customers/data_request",
  "customers/redact",
  "shop/redact",
] as const;

export const SHOPIFY_WEBHOOK_TOPIC_COUNT = SHOPIFY_WEBHOOK_TOPICS.length;
