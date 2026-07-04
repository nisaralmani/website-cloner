import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { conversations } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { updateOperatorMessage } from "@/lib/inbox/conversation-messages";
import { toApiMessage, toConversationWithAssignee } from "@/lib/inbox/mappers";
import { selectConversationWithAssignee } from "@/lib/inbox/conversation-queries";
import { fetchSegmentsForConversation } from "@/lib/inbox/conversation-segments";
import { selectMessageWithAuthor } from "@/lib/inbox/message-queries";
import {
  publishConversationUpdated,
  publishMessageUpdated,
} from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";

type RouteContext = { params: Promise<{ id: string; messageId: string }> };

async function getConversationForWorkspace(id: string, workspaceId: string) {
  const db = await getDb();
  return selectOne(
    db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.workspaceId, workspaceId))),
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, messageId } = await context.params;
  const conversation = await getConversationForWorkspace(id, session.workspace.id);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = await getDb();
  const result = await updateOperatorMessage(db, id, messageId, body.text ?? "");

  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (result.reason === "empty_text") {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }
    if (result.reason === "not_operator") {
      return NextResponse.json({ error: "Only operator messages can be edited" }, { status: 400 });
    }
    return NextResponse.json({ error: "Messages with attachments cannot be edited" }, { status: 400 });
  }

  const joined = await selectOne(selectMessageWithAuthor(db, messageId));
  if (!joined) {
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }

  const apiMessage = toApiMessage(joined.message, joined.author, joined.reminder);
  const conversationJoined = await selectOne(
    selectConversationWithAssignee(db, id, session.workspace.id),
  );
  if (!conversationJoined) {
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }

  const segments = await fetchSegmentsForConversation(db, id);
  const updatedConversation = toConversationWithAssignee(
    conversationJoined.conversation,
    conversationJoined.assignee,
    segments,
  );
  const workspaceId = session.workspace.id;

  publishMessageUpdated(workspaceId, id, [apiMessage]);
  const conversationList = await fetchWorkspaceConversations(workspaceId);
  publishConversationUpdated(workspaceId, conversationList);

  return NextResponse.json({
    message: apiMessage,
    conversation: updatedConversation,
  });
}
