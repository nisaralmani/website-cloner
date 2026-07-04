import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import {
  isValidInternalSecret,
  unauthorizedInternal,
  workspaceIdFromInternalOrSession,
} from "@/lib/auth/internal-request";
import { upsertShopifyContact } from "@/lib/contacts/shopify-sync";
import { requireSession } from "@/lib/auth/request";
import { enrichContactFromShopify } from "@/lib/integrations/shopify-contact-enrich";
import { runShopifyBulkContactSync } from "@/lib/integrations/shopify-bulk-sync";
import { fetchShopifyWorkspaceStatus } from "@/lib/integrations/shopify-context";
import { applyShopifyCustomerToConversations } from "@/lib/inbox/shopify-conversation";
export async function POST(request: Request) {
  let body: { workspaceId?: string } = {};
  try {
    body = (await request.json()) as { workspaceId?: string };
  } catch {
    if (!isValidInternalSecret(request)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
  }

  const workspaceId = await workspaceIdFromInternalOrSession(request, body.workspaceId);
  if (!workspaceId) {
    if (isValidInternalSecret(request)) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }
    return unauthorizedInternal();
  }

  if (!isValidInternalSecret(request)) {
    const session = await requireSession();
    if (!session?.workspace || session.workspace.id !== workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = await getDb();
  const bulk = await runShopifyBulkContactSync(db, workspaceId);
  if (!bulk.ok) {
    return NextResponse.json({ error: bulk.error }, { status: 503 });
  }

  return NextResponse.json({
    linked: true,
    created: bulk.created,
    updated: bulk.updated,
    skipped: bulk.skipped,
    total: bulk.total,
    conversationsTagged: bulk.conversationsTagged,
  });
}

export async function PUT(request: Request) {
  if (!isValidInternalSecret(request)) {
    return unauthorizedInternal();
  }

  let body: {
    workspaceId?: string;
    customer?: { name?: string; email?: string; location?: string; company?: string };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  const name = body.customer?.name?.trim();
  const email = body.customer?.email?.trim();
  if (!workspaceId || !name || !email) {
    return NextResponse.json(
      { error: "workspaceId, customer.name, and customer.email are required" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const result = await upsertShopifyContact(db, workspaceId, {
    name,
    email,
    location: body.customer?.location,
    company: body.customer?.company ?? "Shopify",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const shopifyStatus = await fetchShopifyWorkspaceStatus(workspaceId);
  const conversationsUpdated = await applyShopifyCustomerToConversations(db, workspaceId, email, {
    location: body.customer?.location,
    shop: shopifyStatus?.shop,
  });

  return NextResponse.json({
    created: result.created,
    updated: result.updated,
    contactId: result.contact.id,
    conversationsUpdated,
  });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const db = await getDb();
  const enriched = await enrichContactFromShopify(db, session.workspace.id, email);
  return NextResponse.json(enriched);
}
