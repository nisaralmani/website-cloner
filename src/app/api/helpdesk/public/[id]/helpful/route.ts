import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { incrementHelpdeskHelpfulCount } from "@/lib/helpdesk/helpful";
import { resolveWorkspaceForChatbox } from "@/lib/chatbox/visitor-session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const domain = new URL(request.url).searchParams.get("domain")?.trim();
  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  const db = await getDb();
  const workspace = await resolveWorkspaceForChatbox(db, { domain });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const result = await incrementHelpdeskHelpfulCount(db, workspace.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({ helpfulCount: result.article.helpfulCount });
}
