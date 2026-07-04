import type { AppDatabase } from "@/db/client";
import type { ShopifyCustomerSummary } from "@/types/shopify";
import { normalizeCustomerEmail } from "@/lib/inbox/customer-email";
import {
  applyShopifyCustomerToConversations,
  findConversationIdsByCustomerEmail,
  setShopifyLastOrderVisitorData,
  setShopifyProductsVisitorData,
  setShopifyVisitorDataKey,
  type ShopifyCustomerConversationPatch,
} from "@/lib/inbox/shopify-conversation";

export function buildShopifyCustomerConversationPatch(
  customer: ShopifyCustomerSummary,
  shop?: string,
  storeName?: string,
): ShopifyCustomerConversationPatch {
  const customerId = customer.id.split("/").pop();
  return {
    location: customer.location ?? undefined,
    phone: customer.phone ?? undefined,
    customerId,
    totalSpent: customer.totalSpent
      ? `${customer.totalSpent.amount} ${customer.totalSpent.currencyCode}`
      : undefined,
    orderCount: customer.orderCount > 0 ? String(customer.orderCount) : undefined,
    tags: customer.tags.length > 0 ? customer.tags.join(", ").slice(0, 500) : undefined,
    shop,
    storeName,
  };
}

export async function applyShopifyCustomerOrdersToConversations(
  db: AppDatabase,
  workspaceId: string,
  email: string,
  customer: ShopifyCustomerSummary,
): Promise<void> {
  const conversationIds = await findConversationIdsByCustomerEmail(db, workspaceId, email);
  const latestOrder = customer.orders[0];
  if (!latestOrder) return;

  const detail = latestOrder.total
    ? `${latestOrder.name} · ${latestOrder.total.amount} ${latestOrder.total.currencyCode}`
    : latestOrder.name;

  for (const conversationId of conversationIds) {
    await setShopifyLastOrderVisitorData(db, conversationId, latestOrder.name, detail);
    if (latestOrder.lineItems.length > 0) {
      const products = latestOrder.lineItems
        .map((item) => (item.quantity > 1 ? `${item.quantity}× ${item.title}` : item.title))
        .join(", ")
        .slice(0, 500);
      await setShopifyProductsVisitorData(db, conversationId, products);
    }
    const statusParts = [latestOrder.financialStatus, latestOrder.fulfillmentStatus]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.replace(/_/g, " "));
    if (statusParts.length > 0) {
      await setShopifyVisitorDataKey(
        db,
        conversationId,
        "shopify_order_status",
        statusParts.join(" / ").slice(0, 500),
      );
    }
  }
}

export async function enrichShopifyCustomerInbox(
  db: AppDatabase,
  workspaceId: string,
  email: string,
  customer: ShopifyCustomerSummary,
  shop?: string,
  storeName?: string,
): Promise<number> {
  const patch = buildShopifyCustomerConversationPatch(customer, shop, storeName);
  const conversationsUpdated = await applyShopifyCustomerToConversations(
    db,
    workspaceId,
    email,
    patch,
  );
  if (conversationsUpdated > 0) {
    await applyShopifyCustomerOrdersToConversations(db, workspaceId, email, customer);
  }
  return conversationsUpdated;
}

export async function tagShopifySegmentForSyncedEmails(
  db: AppDatabase,
  workspaceId: string,
  emails: string[],
  shop?: string,
): Promise<number> {
  let conversationsUpdated = 0;
  for (const email of emails) {
    const normalized = normalizeCustomerEmail(email);
    if (!normalized) continue;
    conversationsUpdated += await applyShopifyCustomerToConversations(db, workspaceId, normalized, {
      shop,
    });
  }
  return conversationsUpdated;
}
