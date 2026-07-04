import type { LoaderFunctionArgs } from "react-router";
import db from "../db.server";
import { unauthenticated } from "../shopify.server";
import { SessionNotFoundError } from "@shopify/shopify-app-react-router/server";
import {
  internalAuthFailure,
  verifyBybeltInternalRequest,
} from "../lib/internal-auth.server";
import { listShopifyCustomersForSync } from "../lib/shopify-customers-sync.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!verifyBybeltInternalRequest(request)) {
    return internalAuthFailure();
  }

  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const link = await db.shopLink.findFirst({ where: { workspaceId } });
  if (!link) {
    return Response.json({ linked: false, customers: [] });
  }

  // unauthenticated.admin() can throw in two recoverable ways:
  //   1. SessionNotFoundError   — no session exists for the shop (e.g. after reinstall or session purge).
  //   2. Response(500, body=empty) — the offline refresh-token is expired/revoked
  //      (thrown by @shopify/shopify-app-react-router refresh-token.js).
  // In both cases we return a controlled 503 so the caller can handle gracefully.
  // Any other thrown value is re-thrown unchanged so genuine errors still surface.
  let admin: Awaited<ReturnType<typeof unauthenticated.admin>>["admin"];
  try {
    ({ admin } = await unauthenticated.admin(link.shop));
  } catch (error) {
    const isExpiredToken =
      error instanceof Response && error.status === 500 && !error.bodyUsed;
    const isSessionMissing = error instanceof SessionNotFoundError;
    if (isExpiredToken || isSessionMissing) {
      return Response.json(
        {
          error: "Shopify session expired or revoked — re-authentication required",
          linked: true,
          shop: link.shop,
          requiresReauth: true,
        },
        { status: 503 },
      );
    }
    throw error;
  }

  let customers;
  try {
    customers = await listShopifyCustomersForSync(admin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Shopify customer sync failed";
    return Response.json({ error: message, linked: true, shop: link.shop }, { status: 503 });
  }

  return Response.json({
    linked: true,
    shop: link.shop,
    customers,
  });
};
