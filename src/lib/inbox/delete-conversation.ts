import { and, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import {
  conversationReminders,
  conversationSegments,
  conversations,
  messages,
  visitorChatSessions,
  conversationVisitorData,
} from "@/db/schema";

export async function deleteConversation(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
) {
  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.workspaceId, workspaceId)))
    .limit(1);

  if (existing.length === 0) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const messageRows = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));
  const messageIds = messageRows.map((row) => row.id);

  if (messageIds.length > 0) {
    await db
      .delete(conversationReminders)
      .where(inArray(conversationReminders.messageId, messageIds));
  }

  await db.delete(messages).where(eq(messages.conversationId, conversationId));
  await db.delete(conversationSegments).where(eq(conversationSegments.conversationId, conversationId));
  await db.delete(conversationVisitorData).where(eq(conversationVisitorData.conversationId, conversationId));
  await db.delete(visitorChatSessions).where(eq(visitorChatSessions.conversationId, conversationId));
  await db.delete(conversations).where(eq(conversations.id, conversationId));

  return { ok: true as const, id: conversationId };
}
