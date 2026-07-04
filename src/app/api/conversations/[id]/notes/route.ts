import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, eq, max } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { conversations, messages } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toApiMessage } from "@/lib/inbox/mappers";
import { formatNotePreview } from "@/lib/inbox/notes";
import { selectMessageWithAuthor } from "@/lib/inbox/message-queries";
import {
  publishConversationUpdated,
  publishMessageCreated,
} from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";
import { formatConversationTime, formatMessageTime } from "@/lib/inbox/time";

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
    return NextResponse.json({ error: "Note text is required" }, { status: 400 });
  }

  const conversation = await getConversationForWorkspace(id, session.workspace.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  const [maxOrderRow] = await db
    .select({ value: max(messages.sortOrder) })
    .from(messages)
    .where(eq(messages.conversationId, id));

  const now = new Date();
  const messageId = randomUUID();
  const sortOrder = (maxOrderRow?.value ?? -1) + 1;
  const timeLabel = formatMessageTime(now);

  await db.insert(messages).values({
    id: messageId,
    conversationId: id,
    from: "note",
    text,
    timeLabel,
    sortOrder,
    authorUserId: session.user.id,
  });

  await db
    .update(conversations)
    .set({
      preview: formatNotePreview(text),
      timeLabel: formatConversationTime(now),
    })
    .where(eq(conversations.id, id));

  const joined = await selectOne(selectMessageWithAuthor(db, messageId));
  if (!joined) {
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }

  const apiMessage = toApiMessage(joined.message, joined.author, joined.reminder);
  const workspaceId = session.workspace.id;

  publishMessageCreated(workspaceId, id, [apiMessage]);
  const conversationList = await fetchWorkspaceConversations(workspaceId);
  publishConversationUpdated(workspaceId, conversationList);

  void deliverWorkspaceWebhooks(db, workspaceId, "message:note", {
    conversationId: id,
    message: apiMessage,
  });

  return NextResponse.json({ message: apiMessage });
}
