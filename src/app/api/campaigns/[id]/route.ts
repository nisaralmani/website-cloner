import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { eq } from "drizzle-orm";
import { selectOne } from "@/db/client";
import { campaigns } from "@/db/schema";
import { toCampaign } from "@/lib/campaigns/mappers";
import { deleteCampaign, updateCampaign } from "@/lib/campaigns/update";
import type { CampaignStatus } from "@/types/campaigns";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const row = await selectOne(
    db.select().from(campaigns).where(eq(campaigns.id, id)),
  );

  if (!row || row.workspaceId !== session.workspace.id) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ campaign: toCampaign(row) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { name?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = await getDb();
  const result = await updateCampaign(db, session.workspace.id, id, {
    name: body.name,
    status: body.status as CampaignStatus | undefined,
  });

  if (!result.ok) {
    if ("reason" in result && result.reason === "not_found") {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ campaign: result.campaign });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const result = await deleteCampaign(db, session.workspace.id, id);

  if (!result.ok) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ id: result.id });
}
