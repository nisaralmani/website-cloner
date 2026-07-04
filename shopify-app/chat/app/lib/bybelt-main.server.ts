import {
  BridgeConfigError,
  bridgeRequest,
  type BridgeMethod,
} from "./bridge-client.server";

type RequestMeta = {
  /** Bridge event type for dead-letter classification. */
  event: string;
  workspaceId?: string | null;
  shop?: string | null;
  /** Correlate the bridge request with an upstream (e.g. GDPR) request id. */
  requestId?: string;
};

async function requestMainApp(
  path: string,
  method: BridgeMethod,
  body: Record<string, unknown>,
  meta: RequestMeta,
): Promise<void> {
  // Retries, timeout, request IDs, structured logging, typed errors, and
  // dead-letter capture on permanent failure are all handled by the shared
  // bridge client. A failed request still throws (callers — mostly webhook
  // actions — rely on the throw to return a non-2xx so Shopify retries the
  // delivery).
  await bridgeRequest(path, {
    method,
    body,
    event: meta.event,
    workspaceId: meta.workspaceId ?? null,
    shop: meta.shop ?? null,
    requestId: meta.requestId,
  });
}

export async function upsertMainAppShopifyContact(
  workspaceId: string,
  customer: { name: string; email: string; location?: string; company?: string },
): Promise<boolean> {
  await requestMainApp(
    "/api/integrations/shopify/sync",
    "PUT",
    { workspaceId, customer },
    { event: "shopify_contact_upsert", workspaceId },
  );
  return true;
}

export async function applyShopifyOrderToMainApp(
  workspaceId: string,
  email: string,
  orderName: string,
  orderDetail?: string,
  options?: {
    note?: "create" | "update" | "cancelled" | "paid" | "refund" | "fulfilled" | false;
    products?: string;
    shop?: string;
    orderStatus?: string;
  },
): Promise<boolean> {
  await requestMainApp(
    "/api/integrations/shopify/order",
    "PUT",
    { workspaceId, email, orderName, orderDetail, ...options },
    { event: "shopify_order", workspaceId, shop: options?.shop },
  );
  return true;
}

export async function notifyMainAppShopifyUninstalled(
  workspaceId: string,
  shop: string,
): Promise<boolean> {
  await requestMainApp(
    "/api/integrations/shopify/uninstalled",
    "POST",
    { workspaceId, shop },
    { event: "shopify_uninstalled", workspaceId, shop },
  );
  return true;
}

export async function notifyMainAppShopifyLinked(
  workspaceId: string,
  shop: string,
  domain: string,
): Promise<boolean> {
  await requestMainApp(
    "/api/integrations/shopify/linked",
    "POST",
    { workspaceId, shop, domain },
    { event: "shopify_linked", workspaceId, shop },
  );
  return true;
}

export async function applyShopifyCustomerToMainApp(
  workspaceId: string,
  email: string,
  patch: {
    location?: string;
    phone?: string;
    customerId?: string;
    totalSpent?: string;
    orderCount?: string;
    tags?: string;
    shop?: string;
  },
): Promise<boolean> {
  await requestMainApp(
    "/api/integrations/shopify/customer",
    "PUT",
    { workspaceId, email, ...patch },
    { event: "shopify_customer", workspaceId, shop: patch.shop },
  );
  return true;
}

export async function redactMainAppShopifyCustomer(
  workspaceId: string,
  email: string,
  source: "gdpr" | "delete" = "gdpr",
  requestId?: string,
): Promise<boolean> {
  await requestMainApp(
    "/api/integrations/shopify/redact",
    "POST",
    { workspaceId, email, source },
    { event: "shopify_customer_redact", workspaceId, requestId },
  );
  return true;
}

export async function redactMainAppShopifyShop(
  workspaceId: string,
  shop: string,
  requestId?: string,
): Promise<boolean> {
  await requestMainApp(
    "/api/integrations/shopify/redact-shop",
    "POST",
    { workspaceId, shop },
    { event: "shopify_shop_redact", workspaceId, shop, requestId },
  );
  return true;
}

export async function notifyMainAppShopifyDataRequest(
  workspaceId: string,
  shop: string,
  email?: string,
  requestId?: string,
): Promise<boolean> {
  await requestMainApp(
    "/api/integrations/shopify/data-request",
    "POST",
    { workspaceId, shop, email },
    { event: "shopify_data_request", workspaceId, shop, requestId },
  );
  return true;
}

export type MainAppContactSyncResult = {
  ok: boolean;
  error?: string;
  created?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  conversationsTagged?: number;
};

export async function triggerMainAppContactSync(
  workspaceId: string,
): Promise<MainAppContactSyncResult> {
  // Unlike the other bridge helpers this one is surfaced to the operator UI, so
  // it preserves its soft-failure contract: it never throws and always returns a
  // structured result. The shared client still logs every failure.
  try {
    const payload = (await bridgeRequest<{
      created?: number;
      updated?: number;
      skipped?: number;
      total?: number;
      conversationsTagged?: number;
    }>("/api/integrations/shopify/sync", {
      method: "POST",
      body: { workspaceId },
      event: "shopify_contact_sync",
      workspaceId,
    })) ?? {};

    return {
      ok: true,
      created: payload.created,
      updated: payload.updated,
      skipped: payload.skipped,
      total: payload.total,
      conversationsTagged: payload.conversationsTagged,
    };
  } catch (error) {
    if (error instanceof BridgeConfigError) {
      return { ok: false, error: "Internal sync bridge is not configured on the server." };
    }
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Could not reach the Bybelt app to sync contacts.";
    return { ok: false, error: message };
  }
}
