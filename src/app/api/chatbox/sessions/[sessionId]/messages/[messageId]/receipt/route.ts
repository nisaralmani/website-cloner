import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getVisitorChatSession, touchVisitorChatSession } from "@/lib/chatbox/visitor-session";
import { applyMessageReceipt, type MessageReceiptStatus } from "@/lib/inbox/message-receipts";
import { isOperatorPrivacyModeEnabled } from "@/lib/chatbox/operator-visibility";

type RouteContext = { params: Promise<{ sessionId: string; messageId: string }> };

function parseReceiptStatus(value: string | undefined): MessageReceiptStatus | null {
  if (value === "delivered" || value === "read") {
    return value;
  }
  return null;
}

export async function POST(request: Request, context: RouteContext) {
  const { sessionId, messageId } = await context.params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const status = parseReceiptStatus(body.status);
  if (!status) {
    return NextResponse.json({ error: "status must be delivered or read" }, { status: 400 });
  }

  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await touchVisitorChatSession(db, sessionId);

  const privacyMode = await isOperatorPrivacyModeEnabled(db, session.workspaceId);
  if (privacyMode && status === "read") {
    return NextResponse.json({ message: null, suppressed: true });
  }

  const message = await applyMessageReceipt(
    db,
    session.workspaceId,
    session.conversationId,
    messageId,
    status,
    "operator",
  );

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ message });
}
