import { randomUUID } from "crypto";
import { eq, max } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversations, messages } from "@/db/schema";
import {
  publishConversationUpdated,
  publishMessageCreated,
} from "@/lib/inbox/event-bus";
import { toApiMessage } from "@/lib/inbox/mappers";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { formatConversationTime, formatMessageTime, truncatePreview } from "@/lib/inbox/time";
import type { ApiMessage } from "@/lib/inbox/mappers";

async function nextSortOrder(db: AppDatabase, conversationId: string) {
  const [maxOrderRow] = await db
    .select({ value: max(messages.sortOrder) })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));
  return (maxOrderRow?.value ?? -1) + 1;
}

export async function insertWidgetOperatorMessage(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  text: string,
): Promise<ApiMessage | null> {
  const now = new Date();
  const messageId = randomUUID();
  const sortOrder = await nextSortOrder(db, conversationId);

  await db.insert(messages).values({
    id: messageId,
    conversationId,
    from: "operator",
    text,
    timeLabel: formatMessageTime(now),
    sortOrder,
  });

  await db
    .update(conversations)
    .set({
      preview: truncatePreview(text),
      timeLabel: formatConversationTime(now),
      unread: 0,
    })
    .where(eq(conversations.id, conversationId));

  const row = await selectOne(db.select().from(messages).where(eq(messages.id, messageId)));
  if (!row) return null;

  const apiMessage = toApiMessage(row, null, null);
  publishMessageCreated(workspaceId, conversationId, [apiMessage]);
  const conversationList = await fetchWorkspaceConversations(workspaceId);
  publishConversationUpdated(workspaceId, conversationList);
  return apiMessage;
}

export async function insertInternalSystemNote(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  text: string,
) {
  const now = new Date();
  const messageId = randomUUID();
  const sortOrder = await nextSortOrder(db, conversationId);

  await db.insert(messages).values({
    id: messageId,
    conversationId,
    from: "note",
    text,
    timeLabel: formatMessageTime(now),
    sortOrder,
  });

  const row = await selectOne(db.select().from(messages).where(eq(messages.id, messageId)));
  if (!row) return null;

  const apiMessage = toApiMessage(row, null, null);
  publishMessageCreated(workspaceId, conversationId, [apiMessage]);
  return apiMessage;
}
