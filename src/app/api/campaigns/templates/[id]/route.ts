import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { deleteCampaignTemplate, updateCampaignTemplate } from "@/lib/campaigns/templates";
import type { CampaignTemplate } from "@/types/campaigns";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { name?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = await getDb();
  const result = await updateCampaignTemplate(db, session.workspace.id, id, {
    name: body.name,
    category: body.category as CampaignTemplate["category"] | undefined,
  });

  if (!result.ok) {
    if ("reason" in result && result.reason === "not_found") {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ template: result.template });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const result = await deleteCampaignTemplate(db, session.workspace.id, id);

  if (!result.ok) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ id: result.id });
}
