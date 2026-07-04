import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { addCampaignRecipients, listCampaignRecipients, removeCampaignRecipient } from "@/lib/campaigns/recipients";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const result = await listCampaignRecipients(db, session.workspace.id, id);

  if (!result.ok) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({
    recipients: result.recipients,
    contactCount: result.contactCount,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { contactIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(body.contactIds) || body.contactIds.length === 0) {
    return NextResponse.json({ error: "contactIds is required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await addCampaignRecipients(
    db,
    session.workspace.id,
    id,
    body.contactIds,
  );

  if (!result.ok) {
    if ("reason" in result && result.reason === "not_found") {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ contactCount: result.contactCount });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const contactId = new URL(request.url).searchParams.get("contactId")?.trim();
  if (!contactId) {
    return NextResponse.json({ error: "contactId is required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await removeCampaignRecipient(db, session.workspace.id, id, contactId);

  if (!result.ok) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ contactCount: result.contactCount });
}
