export type ShopifyOrderLineItem = {
  title: string;
  quantity: number;
};

export type ShopifyOrderSummary = {
  id: string;
  name: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  processedAt: string | null;
  total: { amount: string; currencyCode: string } | null;
  adminUrl: string;
  lineItems: ShopifyOrderLineItem[];
};

export type ShopifyCustomerSummary = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  orderCount: number;
  totalSpent: { amount: string; currencyCode: string } | null;
  tags: string[];
  location: string | null;
  adminUrl: string;
  orders: ShopifyOrderSummary[];
};

export type ShopifyWorkspaceLinkStatus = {
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

export type ShopifyCustomerContextResponse =
  | { linked: false }
  | {
      linked: true;
      shop: string;
      shopName?: string | null;
      shopAdminUrl?: string;
      widgetEnabled: boolean;
      customer: null;
    }
  | {
      linked: true;
      shop: string;
      shopName?: string | null;
      shopAdminUrl: string;
      widgetEnabled: boolean;
      customer: ShopifyCustomerSummary;
    };
