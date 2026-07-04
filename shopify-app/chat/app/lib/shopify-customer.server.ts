import db from "../db.server";
import { unauthenticated } from "../shopify.server";
import { SHOPIFY_WEBHOOK_TOPIC_COUNT } from "./shopify-webhooks.server";
import { formatShopifyCustomerName } from "./shopify-customer-fields.server";

const CUSTOMER_BY_EMAIL_QUERY = `#graphql
  query BybeltCustomerByEmail($query: String!) {
    shop {
      name
    }
    customers(first: 1, query: $query) {
      nodes {
        id
        firstName
        lastName
        email
        phone
        numberOfOrders
        amountSpent {
          amount
          currencyCode
        }
        tags
        defaultAddress {
          city
          country
        }
        orders(first: 3, sortKey: PROCESSED_AT, reverse: true) {
          nodes {
            id
            name
            displayFinancialStatus
            displayFulfillmentStatus
            processedAt
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 5) {
              nodes {
                title
                quantity
              }
            }
          }
        }
      }
    }
  }
`;

export type ShopifyCustomerContext = {
  linked: true;
  shop: string;
  shopName: string | null;
  shopAdminUrl: string;
  widgetEnabled: boolean;
  customer: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    orderCount: number;
    totalSpent: { amount: string; currencyCode: string } | null;
    tags: string[];
    location: string | null;
    adminUrl: string;
    orders: Array<{
      id: string;
      name: string;
      financialStatus: string | null;
      fulfillmentStatus: string | null;
      processedAt: string | null;
      total: { amount: string; currencyCode: string } | null;
      adminUrl: string;
      lineItems: Array<{ title: string; quantity: number }>;
    }>;
  };
};

export type ShopifyWorkspaceStatus = {
  linked: boolean;
  shop?: string;
  shopAdminUrl?: string;
  widgetEnabled?: boolean;
  domain?: string;
  lastContactSyncAt?: string | null;
  lastContactSyncCreated?: number | null;
  lastContactSyncUpdated?: number | null;
  lastContactSyncTotal?: number | null;
  webhookTopicCount?: number;
};

export async function getWorkspaceShopifyStatus(
  workspaceId: string,
): Promise<ShopifyWorkspaceStatus> {
  const link = await db.shopLink.findFirst({ where: { workspaceId } });
  if (!link) {
    return { linked: false };
  }
  return {
    linked: true,
    shop: link.shop,
    shopAdminUrl: shopAdminBase(link.shop),
    widgetEnabled: link.widgetEnabled,
    domain: link.domain,
    webhookTopicCount: SHOPIFY_WEBHOOK_TOPIC_COUNT,
    lastContactSyncAt: link.lastContactSyncAt?.toISOString() ?? null,
    lastContactSyncCreated: link.lastContactSyncCreated,
    lastContactSyncUpdated: link.lastContactSyncUpdated,
    lastContactSyncTotal: link.lastContactSyncTotal,
  };
}

function shopAdminBase(shop: string): string {
  const host = shop.includes(".") ? shop : `${shop}.myshopify.com`;
  return `https://${host}/admin`;
}

const CUSTOMER_SPENT_QUERY = `#graphql
  query BybeltCustomerEnrich($id: ID!) {
    customer(id: $id) {
      amountSpent {
        amount
        currencyCode
      }
      numberOfOrders
      tags
    }
  }
`;

export type CustomerWebhookEnrichment = {
  totalSpent?: string;
  orderCount?: string;
  tags?: string;
};

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export async function fetchCustomerTotalSpentLabel(
  admin: AdminGraphql,
  customerId: number | string,
): Promise<string | undefined> {
  const enrichment = await fetchCustomerEnrichment(admin, customerId);
  return enrichment.totalSpent;
}

export async function fetchCustomerEnrichment(
  admin: AdminGraphql,
  customerId: number | string,
): Promise<CustomerWebhookEnrichment> {
  const numericId = String(customerId).trim();
  if (!numericId) return {};

  const response = await admin.graphql(CUSTOMER_SPENT_QUERY, {
    variables: { id: `gid://shopify/Customer/${numericId}` },
  });
  if (!response.ok) return {};

  const json = (await response.json()) as {
    data?: {
      customer?: {
        amountSpent?: { amount: string; currencyCode: string } | null;
        numberOfOrders?: number | null;
        tags?: string[] | null;
      } | null;
    };
  };

  const customer = json.data?.customer;
  if (!customer) return {};

  const result: CustomerWebhookEnrichment = {};
  if (customer.amountSpent?.amount) {
    result.totalSpent = `${customer.amountSpent.amount} ${customer.amountSpent.currencyCode}`;
  }
  if (customer.numberOfOrders != null) {
    result.orderCount = String(customer.numberOfOrders);
  }
  const tags = (customer.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  if (tags.length > 0) {
    result.tags = tags.join(", ").slice(0, 500);
  }
  return result;
}

export async function fetchCustomerWebhookEnrichment(
  shop: string,
  customerId: number | string | null | undefined,
): Promise<CustomerWebhookEnrichment> {
  if (customerId == null) return {};
  try {
    const { admin } = await unauthenticated.admin(shop);
    return await fetchCustomerEnrichment(admin, customerId);
  } catch {
    return {};
  }
}

const CUSTOMER_EMAIL_QUERY = `#graphql
  query BybeltCustomerEmail($id: ID!) {
    customer(id: $id) {
      email
    }
  }
`;

export async function fetchCustomerEmailForWebhook(
  shop: string,
  customerId: number | string,
): Promise<string | undefined> {
  const numericId = String(customerId).trim();
  if (!numericId) return undefined;
  try {
    const { admin } = await unauthenticated.admin(shop);
    const response = await admin.graphql(CUSTOMER_EMAIL_QUERY, {
      variables: { id: `gid://shopify/Customer/${numericId}` },
    });
    if (!response.ok) return undefined;
    const json = (await response.json()) as {
      data?: { customer?: { email?: string | null } | null };
    };
    return json.data?.customer?.email?.trim() || undefined;
  } catch {
    return undefined;
  }
}

function gidTail(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1] ?? gid;
}

export async function loadShopifyCustomerContext(
  workspaceId: string,
  email: string,
): Promise<ShopifyCustomerContext | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const link = await db.shopLink.findFirst({ where: { workspaceId } });
  if (!link) return null;

  const { admin, session } = await unauthenticated.admin(link.shop);
  if (session.shop !== link.shop) return null;

  const response = await admin.graphql(CUSTOMER_BY_EMAIL_QUERY, {
    variables: { query: `email:${normalizedEmail}` },
  });
  if (!response.ok) return null;

  const json = (await response.json()) as {
    data?: {
      shop?: { name?: string | null } | null;
      customers?: {
        nodes?: Array<{
          id: string;
          firstName?: string | null;
          lastName?: string | null;
          email?: string | null;
          phone?: string | null;
          numberOfOrders?: number;
          amountSpent?: { amount: string; currencyCode: string } | null;
          tags?: string[] | null;
          defaultAddress?: { city?: string | null; country?: string | null } | null;
          orders?: {
            nodes?: Array<{
              id: string;
              name: string;
              displayFinancialStatus?: string | null;
              displayFulfillmentStatus?: string | null;
              processedAt?: string | null;
              totalPriceSet?: {
                shopMoney?: { amount: string; currencyCode: string } | null;
              } | null;
              lineItems?: {
                nodes?: Array<{ title?: string | null; quantity?: number | null }>;
              };
            }>;
          };
        }>;
      };
    };
  };

  const node = json.data?.customers?.nodes?.[0];
  if (!node) return null;

  const adminBase = shopAdminBase(link.shop);
  const customerId = gidTail(node.id);

  return {
    linked: true,
    shop: link.shop,
    shopName: json.data?.shop?.name?.trim() || null,
    shopAdminUrl: adminBase,
    widgetEnabled: link.widgetEnabled,
    customer: {
      id: node.id,
      displayName: formatShopifyCustomerName(node.firstName, node.lastName, node.email),
      email: node.email ?? null,
      phone: node.phone ?? null,
      orderCount: node.numberOfOrders ?? 0,
      totalSpent: node.amountSpent ?? null,
      tags: (node.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
      location: node.defaultAddress
        ? [node.defaultAddress.city, node.defaultAddress.country]
            .filter(Boolean)
            .join(", ") || null
        : null,
      adminUrl: `${adminBase}/customers/${customerId}`,
      orders: (node.orders?.nodes ?? []).map((order) => {
        const orderId = gidTail(order.id);
        return {
          id: order.id,
          name: order.name,
          financialStatus: order.displayFinancialStatus ?? null,
          fulfillmentStatus: order.displayFulfillmentStatus ?? null,
          processedAt: order.processedAt ?? null,
          total: order.totalPriceSet?.shopMoney ?? null,
          adminUrl: `${adminBase}/orders/${orderId}`,
          lineItems: (order.lineItems?.nodes ?? [])
            .map((item) => ({
              title: item.title?.trim() || "Item",
              quantity: item.quantity ?? 1,
            }))
            .filter((item) => item.title.length > 0),
        };
      }),
    },
  };
}
