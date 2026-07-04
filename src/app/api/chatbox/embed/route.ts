import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { buildChatboxEmbedSnippet } from "@/lib/chatbox/embed-snippet";
import { resolveWorkspaceForChatbox } from "@/lib/chatbox/visitor-session";

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  return url.origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId")?.trim();
  const domain = url.searchParams.get("domain")?.trim();
  const origin = requestOrigin(request);
  const db = await getDb();

  if (workspaceId || domain) {
    const workspace = await resolveWorkspaceForChatbox(db, { workspaceId, domain });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json(buildChatboxEmbedSnippet(origin, workspace));
  }

  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    buildChatboxEmbedSnippet(origin, {
      id: session.workspace.id,
      domain: session.workspace.domain,
    }),
  );
}
