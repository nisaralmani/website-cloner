import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { helpdeskArticles, workspaces } from "@/db/schema";
import { resolveWorkspaceForChatbox } from "@/lib/chatbox/visitor-session";
import { toHelpdeskArticle } from "@/lib/helpdesk/mappers";

export async function GET(request: Request) {
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

  const workspaceRow = await selectOne(
    db
      .select({ helpdeskEnabled: workspaces.helpdeskEnabled })
      .from(workspaces)
      .where(eq(workspaces.id, workspace.id)),
  );

  const articleRows = await selectAll(
    db
      .select()
      .from(helpdeskArticles)
      .where(
        and(
          eq(helpdeskArticles.workspaceId, workspace.id),
          eq(helpdeskArticles.status, "visible"),
        ),
      )
      .orderBy(asc(helpdeskArticles.sortOrder)),
  );

  return NextResponse.json({
    workspaceId: workspace.id,
    helpdeskEnabled: workspaceRow?.helpdeskEnabled === 1,
    articles: articleRows.map(toHelpdeskArticle),
  });
}
