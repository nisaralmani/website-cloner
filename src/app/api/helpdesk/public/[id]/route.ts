import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { helpdeskArticles } from "@/db/schema";
import { resolveWorkspaceForChatbox } from "@/lib/chatbox/visitor-session";
import { toHelpdeskArticle } from "@/lib/helpdesk/mappers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId")?.trim();
  const domain = url.searchParams.get("domain")?.trim();

  if (!workspaceId && !domain) {
    return NextResponse.json({ error: "workspaceId or domain is required" }, { status: 400 });
  }

  const db = await getDb();
  const workspace = await resolveWorkspaceForChatbox(db, { workspaceId, domain });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const row = await selectOne(
    db
      .select()
      .from(helpdeskArticles)
      .where(
        and(
          eq(helpdeskArticles.id, id),
          eq(helpdeskArticles.workspaceId, workspace.id),
          eq(helpdeskArticles.status, "visible"),
        ),
      ),
  );

  if (!row) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  await db
    .update(helpdeskArticles)
    .set({ views: row.views + 1 })
    .where(eq(helpdeskArticles.id, id));

  return NextResponse.json({
    article: toHelpdeskArticle({ ...row, views: row.views + 1 }),
  });
}
