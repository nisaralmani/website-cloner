import { NextResponse } from "next/server";
import { getDb, selectOne } from "@/db/client";
import { eq } from "drizzle-orm";
import { helpdeskArticles } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { deleteHelpdeskArticle, updateHelpdeskArticle } from "@/lib/helpdesk/update";
import { toHelpdeskArticle } from "@/lib/helpdesk/mappers";
import { assertCanDeleteWorkspaceData } from "@/lib/workspaces/operator-permissions";
import { assertHelpdeskWritesAllowed } from "@/lib/helpdesk/plan-access";
import type { HelpdeskArticleStatus } from "@/types/helpdesk";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const row = await selectOne(
    db.select().from(helpdeskArticles).where(eq(helpdeskArticles.id, id)),
  );

  if (!row || row.workspaceId !== session.workspace.id) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({ article: toHelpdeskArticle(row) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { title?: string; status?: string; categoryId?: string | null; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = await getDb();
  const planError = await assertHelpdeskWritesAllowed(db, session.workspace.id);
  if (planError) {
    return NextResponse.json({ error: planError }, { status: 403 });
  }

  const result = await updateHelpdeskArticle(db, session.workspace.id, id, {
    title: body.title,
    status: body.status as HelpdeskArticleStatus | undefined,
    categoryId: body.categoryId,
    body: body.body,
  });

  if (!result.ok) {
    if ("reason" in result && result.reason === "not_found") {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ article: result.article });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const permissionError = await assertCanDeleteWorkspaceData(
    db,
    session.workspace.id,
    session.role,
  );
  if (permissionError) {
    return NextResponse.json({ error: permissionError }, { status: 403 });
  }

  const result = await deleteHelpdeskArticle(db, session.workspace.id, id);

  if (!result.ok) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({ id: result.id });
}
