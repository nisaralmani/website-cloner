import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getVisitorChatSession, touchVisitorChatSession } from "@/lib/chatbox/visitor-session";
import { isMagicTypeEnabled } from "@/lib/chatbox/operator-visibility";
import { publishConversationTyping } from "@/lib/inbox/typing";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;

  let body: { typing?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.typing !== "boolean") {
    return NextResponse.json({ error: "typing boolean is required" }, { status: 400 });
  }

  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await touchVisitorChatSession(db, sessionId);

  const magicTypeEnabled = await isMagicTypeEnabled(db, session.workspaceId);
  if (!magicTypeEnabled) {
    return NextResponse.json({ ok: true, suppressed: true });
  }

  publishConversationTyping(
    session.workspaceId,
    session.conversationId,
    "visitor",
    body.typing,
  );

  return NextResponse.json({ ok: true });
}
