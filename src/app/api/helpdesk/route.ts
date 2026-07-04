import { NextResponse } from "next/server";
import { and, asc, count, eq, or, sql } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { helpdeskArticles, helpdeskCategories, workspaces } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toHelpdeskArticle, toHelpdeskCategory } from "@/lib/helpdesk/mappers";
import { createHelpdeskArticle } from "@/lib/helpdesk/create";
import { assertHelpdeskWritesAllowed } from "@/lib/helpdesk/plan-access";

const VALID_STATUSES = new Set(["all", "draft", "visible", "hidden"]);

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "articles";
  const statusParam = searchParams.get("status") ?? "all";
  const status = VALID_STATUSES.has(statusParam) ? statusParam : "all";
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const db = await getDb();
  const workspaceId = session.workspace.id;
  const workspace = await selectOne(
    db
      .select({
        helpdeskEnabled: workspaces.helpdeskEnabled,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId)),
  );

  const [articleTotalRow] = await db
    .select({ value: count() })
    .from(helpdeskArticles)
    .where(eq(helpdeskArticles.workspaceId, workspaceId));

  const [categoryTotalRow] = await db
    .select({ value: count() })
    .from(helpdeskCategories)
    .where(eq(helpdeskCategories.workspaceId, workspaceId));

  if (view === "categories") {
    const categoryRows = await selectAll(
      db
        .select()
        .from(helpdeskCategories)
        .where(
          and(
            eq(helpdeskCategories.workspaceId, workspaceId),
            query
              ? sql`lower(${helpdeskCategories.name}) like ${`%${query}%`}`
              : undefined,
          ),
        )
        .orderBy(asc(helpdeskCategories.sortOrder)),
    );

    const categories = await Promise.all(
      categoryRows.map(async (row) => {
        const [articlesInCategory] = await db
          .select({ value: count() })
          .from(helpdeskArticles)
          .where(
            and(
              eq(helpdeskArticles.workspaceId, workspaceId),
              eq(helpdeskArticles.categoryId, row.id),
            ),
          );
        return toHelpdeskCategory(row, articlesInCategory?.value ?? 0);
      }),
    );

    return NextResponse.json({
      articles: [],
      categories,
      helpdeskEnabled: workspace?.helpdeskEnabled === 1,
      articleTotal: articleTotalRow?.value ?? 0,
      categoryTotal: categoryTotalRow?.value ?? 0,
    });
  }

  const articleRows = await selectAll(
    db
      .select()
      .from(helpdeskArticles)
      .where(
        and(
          eq(helpdeskArticles.workspaceId, workspaceId),
          status !== "all" ? eq(helpdeskArticles.status, status) : undefined,
          query
            ? or(
                sql`lower(${helpdeskArticles.title}) like ${`%${query}%`}`,
                sql`lower(${helpdeskArticles.status}) like ${`%${query}%`}`,
              )
            : undefined,
        ),
      )
      .orderBy(asc(helpdeskArticles.sortOrder)),
  );

  return NextResponse.json({
    articles: articleRows.map(toHelpdeskArticle),
    categories: [],
    helpdeskEnabled: workspace?.helpdeskEnabled === 1,
    articleTotal: articleTotalRow?.value ?? 0,
    categoryTotal: categoryTotalRow?.value ?? 0,
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; status?: string; categoryId?: string | null; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const db = await getDb();
  const planError = await assertHelpdeskWritesAllowed(db, session.workspace.id);
  if (planError) {
    return NextResponse.json({ error: planError }, { status: 403 });
  }

  const result = await createHelpdeskArticle(db, session.workspace.id, {
    title: body.title,
    status: body.status as "draft" | "visible" | "hidden" | undefined,
    categoryId: body.categoryId,
    body: body.body,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ article: result.article }, { status: 201 });
}
