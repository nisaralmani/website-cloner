import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  internalAuthFailure,
  verifyBybeltInternalRequest,
} from "../lib/internal-auth.server";
import {
  getWorkspaceShopifyStatus,
  loadShopifyCustomerContext,
} from "../lib/shopify-customer.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!verifyBybeltInternalRequest(request)) {
    return internalAuthFailure();
  }

  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const status = await getWorkspaceShopifyStatus(workspaceId);
  return Response.json(status);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (!verifyBybeltInternalRequest(request)) {
    return internalAuthFailure();
  }

  let body: { workspaceId?: string; email?: string };
  try {
    body = (await request.json()) as { workspaceId?: string; email?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  const email = body.email?.trim();
  if (!workspaceId || !email) {
    return Response.json({ error: "workspaceId and email are required" }, { status: 400 });
  }

  const status = await getWorkspaceShopifyStatus(workspaceId);
  if (!status.linked) {
    return Response.json({ linked: false as const });
  }

  const context = await loadShopifyCustomerContext(workspaceId, email);
  if (!context) {
    return Response.json({
      linked: true,
      shop: status.shop,
      shopName: null,
      shopAdminUrl: status.shopAdminUrl,
      widgetEnabled: status.widgetEnabled,
      customer: null,
    });
  }

  return Response.json(context);
};
