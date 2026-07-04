import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  internalAuthFailure,
  verifyBybeltInternalRequest,
} from "../lib/internal-auth.server";
import { getWorkspaceShopifyStatus } from "../lib/shopify-customer.server";
import { recordShopLinkContactSync } from "../lib/shop-link.server";

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

  let body: {
    workspaceId?: string;
    created?: number;
    updated?: number;
    total?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const created = Number(body.created ?? 0);
  const updated = Number(body.updated ?? 0);
  const total = Number(body.total ?? 0);

  const link = await recordShopLinkContactSync(workspaceId, { created, updated, total });
  if (!link) {
    return Response.json({ error: "Shop not linked" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    lastContactSyncAt: link.lastContactSyncAt?.toISOString() ?? null,
    lastContactSyncCreated: link.lastContactSyncCreated,
    lastContactSyncUpdated: link.lastContactSyncUpdated,
    lastContactSyncTotal: link.lastContactSyncTotal,
  });
};
