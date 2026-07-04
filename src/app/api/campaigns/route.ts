import { NextResponse } from "next/server";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { campaignTemplates, campaigns } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toCampaign, toCampaignCounts } from "@/lib/campaigns/mappers";
import { createCampaign } from "@/lib/campaigns/create";
import { addCampaignRecipients } from "@/lib/campaigns/recipients";

const VALID_TYPES = new Set(["all", "automated", "one-shot"]);

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type") ?? "all";
  const type = VALID_TYPES.has(typeParam) ? typeParam : "all";
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const tag = searchParams.get("tag")?.trim().toLowerCase() ?? "";

  const db = await getDb();

  const templateRows = await selectAll(
    db
      .select()
      .from(campaignTemplates)
      .where(eq(campaignTemplates.workspaceId, session.workspace.id))
      .orderBy(asc(campaignTemplates.sortOrder)),
  );

  const rows = await selectAll(
    db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.workspaceId, session.workspace.id),
          type !== "all" ? eq(campaigns.type, type) : undefined,
          query
            ? or(
                sql`lower(${campaigns.name}) like ${`%${query}%`}`,
                sql`lower(${campaigns.status}) like ${`%${query}%`}`,
              )
            : undefined,
          tag ? sql`lower(${campaigns.name}) like ${`%${tag}%`}` : undefined,
        ),
      )
      .orderBy(asc(campaigns.sortOrder)),
  );

  return NextResponse.json({
    campaigns: rows.map(toCampaign),
    counts: toCampaignCounts(templateRows),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; type?: string; status?: string; contactIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.name?.trim() || !body.type) {
    return NextResponse.json({ error: "name and type are required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await createCampaign(db, session.workspace.id, {
    name: body.name,
    type: body.type as "automated" | "one-shot",
    status: body.status as "draft" | "scheduled" | "sent" | "paused" | undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  let campaign = result.campaign;
  if (Array.isArray(body.contactIds) && body.contactIds.length > 0) {
    const recipientsResult = await addCampaignRecipients(
      db,
      session.workspace.id,
      campaign.id,
      body.contactIds,
    );
    if (!recipientsResult.ok) {
      if ("reason" in recipientsResult && recipientsResult.reason === "not_found") {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }
      return NextResponse.json({ error: recipientsResult.error }, { status: 400 });
    }
    campaign = { ...campaign, contactCount: recipientsResult.contactCount };
  }

  return NextResponse.json({ campaign }, { status: 201 });
}
