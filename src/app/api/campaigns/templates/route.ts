import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  createCampaignTemplate,
  deleteCampaignTemplate,
  listCampaignTemplates,
  updateCampaignTemplate,
} from "@/lib/campaigns/templates";
import type { CampaignTemplate } from "@/types/campaigns";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const templates = await listCampaignTemplates(db, session.workspace.id);
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.name?.trim() || !body.category) {
    return NextResponse.json({ error: "name and category are required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await createCampaignTemplate(db, session.workspace.id, {
    name: body.name,
    category: body.category as CampaignTemplate["category"],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ template: result.template }, { status: 201 });
}
