import type { ShopifyCustomerContextResponse } from "@/types/shopify";
import type { EnrichedCustomer } from "@/lib/email/email-agent";

export function mapShopifyToEnrichedCustomer(
  context: ShopifyCustomerContextResponse | null,
  fallbackEmail: string,
  fallbackName?: string,
): EnrichedCustomer | null {
  if (!context || context.linked !== true || !("customer" in context) || !context.customer) {
    if (!fallbackEmail) return null;
    return {
      name: fallbackName?.trim() || fallbackEmail,
      email: fallbackEmail.toLowerCase(),
      ltv: 0,
      ordersCount: 0,
      tags: [],
      orders: [],
    };
  }

  const customer = context.customer;
  return {
    name: customer.displayName || fallbackName || fallbackEmail,
    email: (customer.email || fallbackEmail).toLowerCase(),
    ltv: Number(customer.totalSpent?.amount || 0),
    ordersCount: customer.orderCount,
    tags: customer.tags,
    orders: customer.orders.map((order) => ({
      number: order.name,
      status: [order.financialStatus, order.fulfillmentStatus].filter(Boolean).join(" / ") || "unknown",
      placedAt: order.processedAt || "",
      items: order.lineItems.reduce((sum, item) => sum + item.quantity, 0),
      total: Number(order.total?.amount || 0),
      currency: order.total?.currencyCode || "USD",
    })),
  };
}
