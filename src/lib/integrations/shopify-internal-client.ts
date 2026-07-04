/**
 * Shopify plugin internal bridge client (Phase 24B).
 *
 * Consolidates duplicated `fetch()` calls to the embedded Shopify app with the
 * shared HTTP client (request-id propagation, timeout, structured logging).
 * Authentication contract is unchanged: `X-Bybelt-Internal-Secret` header.
 */

import { httpJson, httpRequest } from "@/lib/http/client";
import type { ShopifyContactInput } from "@/lib/contacts/shopify-sync";
import type {
  ShopifyCustomerContextResponse,
  ShopifyWorkspaceLinkStatus,
} from "@/types/shopify";

function internalBaseUrl(): string {
  return (
    process.env.SHOPIFY_PLUGIN_INTERNAL_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:3005"
  );
}

function internalSecret(): string | null {
  const secret = process.env.BYBELT_INTERNAL_SECRET?.trim();
  return secret || null;
}

function internalHeaders(): HeadersInit | null {
  const secret = internalSecret();
  if (!secret) return null;
  return {
    "Content-Type": "application/json",
    "X-Bybelt-Internal-Secret": secret,
  };
}

export async function fetchShopifyWorkspaceStatus(
  workspaceId: string,
): Promise<ShopifyWorkspaceLinkStatus | null> {
  const headers = internalHeaders();
  if (!headers) return null;

  const url = new URL(`${internalBaseUrl()}/plugin/shopify/internal/customer`);
  url.searchParams.set("workspaceId", workspaceId);

  try {
    return await httpJson<ShopifyWorkspaceLinkStatus>(url.toString(), {
      headers,
      cache: "no-store",
      event: "shopify_bridge_status",
      timeoutMs: 8_000,
    });
  } catch {
    return null;
  }
}

export async function fetchShopifyCustomerContext(
  workspaceId: string,
  email: string,
): Promise<ShopifyCustomerContextResponse | null> {
  const headers = internalHeaders();
  if (!headers) return null;

  try {
    return await httpJson<ShopifyCustomerContextResponse>(
      `${internalBaseUrl()}/plugin/shopify/internal/customer`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ workspaceId, email }),
        cache: "no-store",
        event: "shopify_bridge_customer_context",
        timeoutMs: 8_000,
      },
    );
  } catch {
    return null;
  }
}

export type ShopifyCustomersFetchResult =
  | { ok: true; customers: ShopifyContactInput[] }
  | { ok: false; error: string };

export async function fetchShopifyCustomersForSync(
  workspaceId: string,
): Promise<ShopifyCustomersFetchResult> {
  const headers = internalHeaders();
  if (!headers) {
    return { ok: false, error: "Shopify plugin bridge is not configured." };
  }

  const url = new URL(`${internalBaseUrl()}/plugin/shopify/internal/sync`);
  url.searchParams.set("workspaceId", workspaceId);

  try {
    const payload = await httpJson<{ customers?: ShopifyContactInput[]; error?: string }>(
      url.toString(),
      {
        headers,
        cache: "no-store",
        event: "shopify_bridge_sync",
        timeoutMs: 15_000,
      },
    );
    if (!payload) {
      return { ok: false, error: "Shopify customer sync unavailable." };
    }
    return { ok: true, customers: payload.customers ?? [] };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not reach the Shopify plugin backend.",
    };
  }
}

export type ShopifyContactSyncStats = {
  created: number;
  updated: number;
  total: number;
};

export async function recordShopifyContactSync(
  workspaceId: string,
  stats: ShopifyContactSyncStats,
): Promise<boolean> {
  const headers = internalHeaders();
  if (!headers) return false;

  try {
    await httpRequest(`${internalBaseUrl()}/plugin/shopify/internal/sync-status`, {
      method: "POST",
      headers,
      body: JSON.stringify({ workspaceId, ...stats }),
      event: "shopify_bridge_sync_status",
      timeoutMs: 8_000,
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchLinkedShopifyWorkspaceIds(): Promise<string[] | null> {
  const headers = internalHeaders();
  if (!headers) return null;

  try {
    const payload = await httpJson<{ workspaceIds?: string[] }>(
      `${internalBaseUrl()}/plugin/shopify/internal/workspaces`,
      {
        headers,
        cache: "no-store",
        event: "shopify_bridge_workspaces",
        timeoutMs: 8_000,
      },
    );
    return payload?.workspaceIds ?? [];
  } catch {
    return null;
  }
}

export async function fetchShopifyContactSyncStatus(
  workspaceId: string,
): Promise<ShopifyWorkspaceLinkStatus | null> {
  const headers = internalHeaders();
  if (!headers) return null;

  const url = new URL(`${internalBaseUrl()}/plugin/shopify/internal/sync-status`);
  url.searchParams.set("workspaceId", workspaceId);

  try {
    return await httpJson<ShopifyWorkspaceLinkStatus>(url.toString(), {
      headers,
      cache: "no-store",
      event: "shopify_bridge_sync_status_get",
      timeoutMs: 8_000,
    });
  } catch {
    return null;
  }
}
