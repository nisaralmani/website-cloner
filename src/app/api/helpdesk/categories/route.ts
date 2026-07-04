import { NextResponse } from "next/server";
import { asc, count, eq } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { helpdeskArticles, helpdeskCategories } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { createHelpdeskCategory } from "@/lib/helpdesk/category";
import { toHelpdeskCategory } from "@/lib/helpdesk/mappers";
import { assertHelpdeskWritesAllowed } from "@/lib/helpdesk/plan-access";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;
  const rows = await selectAll(
    db
      .select()
      .from(helpdeskCategories)
      .where(eq(helpdeskCategories.workspaceId, workspaceId))
      .orderBy(asc(helpdeskCategories.sortOrder)),
  );

  const categories = await Promise.all(
    rows.map(async (row) => {
      const [articlesInCategory] = await db
        .select({ value: count() })
        .from(helpdeskArticles)
        .where(eq(helpdeskArticles.categoryId, row.id));
      return toHelpdeskCategory(row, articlesInCategory?.value ?? 0);
    }),
  );

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const db = await getDb();
  const planError = await assertHelpdeskWritesAllowed(db, session.workspace.id);
  if (planError) {
    return NextResponse.json({ error: planError }, { status: 403 });
  }

  const result = await createHelpdeskCategory(db, session.workspace.id, body.name);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ category: result.category }, { status: 201 });
}
