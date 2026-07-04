export function formatShopifyOrderStatus(
  financialStatus?: string | null,
  fulfillmentStatus?: string | null,
): string | undefined {
  const parts = [financialStatus, fulfillmentStatus]
    .filter(Boolean)
    .map((value) => String(value).replace(/_/g, " "));
  if (parts.length === 0) return undefined;
  return parts.join(" / ").slice(0, 500);
}

export type ShopifyOrderWebhookPayload = {
  name?: string | null;
  email?: string | null;
  total_price?: string | null;
  currency?: string | null;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  line_items?: Array<{ name?: string | null; quantity?: number | null }> | null;
  customer?: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
};

export function orderEmailFromPayload(order: ShopifyOrderWebhookPayload): string | undefined {
  return (order.customer?.email ?? order.email)?.trim() || undefined;
}

export function orderDetailFromPayload(order: ShopifyOrderWebhookPayload): string | undefined {
  const orderName = order.name?.trim();
  if (!orderName) return undefined;

  const status = formatShopifyOrderStatus(order.financial_status, order.fulfillment_status);
  if (order.total_price && order.currency) {
    const base = `${orderName} · ${order.total_price} ${order.currency}`;
    return status ? `${base} · ${status}` : base;
  }
  return status ? `${orderName} · ${status}` : orderName;
}
