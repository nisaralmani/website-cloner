import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { conversations } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { ingestVisitorMessage } from "@/lib/inbox/visitor-ingest";

type RouteContext = { params: Promise<{ id: string }> };

async function getConversationForWorkspace(id: string, workspaceId: string) {
  const db = await getDb();
  return selectOne(
    db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.workspaceId, workspaceId))),
  );
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const text = body.text?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ error: "Message text is required" }, { status: 400 });
  }

  const conversation = await getConversationForWorkspace(id, session.workspace.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  const result = await ingestVisitorMessage(db, session.workspace.id, id, text);

  if (result.dropped) {
    return NextResponse.json({
      dropped: true,
      triage: result.triage,
      conversation: null,
      message: null,
    });
  }

  return NextResponse.json({
    message: result.message,
    conversation: result.conversation,
    triage: result.triage,
  });
}
