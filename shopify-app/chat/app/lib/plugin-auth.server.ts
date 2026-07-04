import { redirect } from "react-router";
import { SessionNotFoundError } from "@shopify/shopify-app-react-router/server";
import { login, registerWebhooks, sessionStorage, unauthenticated } from "../shopify.server";
import {
  SHOPIFY_AUTH_CALLBACK_PATH,
  shopifyApiClient,
} from "./shopify-api.server";

function sanitizeShop(shopParam: string): string | null {
  const normalized = shopParam
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const withDomain = normalized.includes(".")
    ? normalized
    : `${normalized}.myshopify.com`;
  return shopifyApiClient.utils.sanitizeShop(withDomain, true);
}

export function shopFromRequest(request: Request): string | null {
  const shopParam = new URL(request.url).searchParams.get("shop");
  if (!shopParam) return null;
  return sanitizeShop(shopParam);
}

async function redirectToShopifyOAuth(request: Request, shop: string): Promise<never> {
  const rawResponse = new Response(null, { status: 302 });
  const beginResponse = await shopifyApiClient.auth.begin({
    shop,
    callbackPath: SHOPIFY_AUTH_CALLBACK_PATH,
    isOnline: false,
    rawRequest: request,
    rawResponse,
  });

  const location =
    beginResponse.headers.get("Location") ?? beginResponse.headers.get("location");

  if (beginResponse.status >= 300 && beginResponse.status < 400 && location) {
    const headers = new Headers();
    beginResponse.headers.forEach((value: string, key: string) => {
      if (key.toLowerCase() !== "location") {
        headers.append(key, value);
      }
    });
    throw redirect(location, { headers });
  }

  throw new Response(null, {
    status: beginResponse.status,
    headers: beginResponse.headers,
  });
}

async function clearShopSessions(shop: string, sessionId?: string) {
  if (sessionId) {
    await sessionStorage.deleteSession(sessionId);
    return;
  }

  const sessions = await sessionStorage.findSessionsByShop(shop);
  await Promise.all(sessions.map((session) => sessionStorage.deleteSession(session.id)));
}

export async function reauthorizeShopify(
  request: Request,
  shop: string,
  sessionId?: string,
): Promise<never> {
  await clearShopSessions(shop, sessionId);
  return redirectToShopifyOAuth(request, shop);
}

/**
 * Returns true when the Shopify library throws a raw Response(500) from its
 * refresh-token path (see @shopify/shopify-app-react-router dist/cjs/server/helpers/refresh-token.js).
 * This happens when the stored offline refresh-token is expired or has been revoked.
 * It is NOT a generic server error — it is a known, recoverable token-expiry condition.
 */
function isExpiredSessionResponse(error: unknown): boolean {
  return (
    error instanceof Response &&
    error.status === 500 &&
    // Guard: only treat empty-body 500s as the token-refresh failure.
    // A 500 that carries a body is a real server error and must surface normally.
    error.bodyUsed === false
  );
}

export async function authenticatePluginAdmin(request: Request) {
  const shop = shopFromRequest(request);
  if (!shop) {
    throw redirect("/auth/login");
  }

  try {
    const auth = await unauthenticated.admin(shop);
    if (auth.session.shop !== shop) {
      await reauthorizeShopify(request, shop, auth.session.id);
    }
    return auth;
  } catch (error) {
    if (error instanceof SessionNotFoundError || isExpiredSessionResponse(error)) {
      // Either no session exists at all, or the offline token / refresh-token is
      // expired/revoked.  In both cases the correct recovery is to delete any
      // stale session records and restart a clean Shopify OAuth flow.
      return await reauthorizeShopify(request, shop);
    }
    throw error;
  }
}

export async function handleShopifyOAuthCallback(request: Request): Promise<never> {
  const rawResponse = new Response(null, { status: 200 });
  const callback = await shopifyApiClient.auth.callback({
    rawRequest: request,
    rawResponse,
    expiring: true,
  });

  await sessionStorage.storeSession(callback.session);
  await registerWebhooks({ session: callback.session });

  const shop = callback.session.shop;
  const headers = new Headers(callback.headers as HeadersInit);
  throw redirect(`/initiate/plugin/shopify?shop=${encodeURIComponent(shop)}`, {
    headers,
  });
}

export async function handleShopifyOAuthBegin(request: Request): Promise<never> {
  const shop = shopFromRequest(request);
  if (!shop) {
    await login(request);
    throw new Response("Missing shop parameter", { status: 400 });
  }
  return redirectToShopifyOAuth(request, shop);
}
