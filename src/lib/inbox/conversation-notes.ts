import { and, desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversations, messages } from "@/db/schema";
import { formatNotePreview } from "@/lib/inbox/notes";
import { syncConversationPreviewFromLatestMessage } from "@/lib/inbox/conversation-preview";

export type DeleteConversationNoteResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_a_note" | "not_author" };

export type UpdateConversationNoteResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_a_note" | "empty_text" | "not_author" };

export async function deleteConversationNote(
  db: AppDatabase,
  conversationId: string,
  messageId: string,
  actorUserId: string,
): Promise<DeleteConversationNoteResult> {
  const row = await selectOne(
    db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId))),
  );

  if (!row) {
    return { ok: false, reason: "not_found" };
  }

  if (row.from !== "note") {
    return { ok: false, reason: "not_a_note" };
  }

  if (!row.authorUserId || row.authorUserId !== actorUserId) {
    return { ok: false, reason: "not_author" };
  }

  await db.delete(messages).where(eq(messages.id, messageId));
  await syncConversationPreviewFromLatestMessage(db, conversationId);

  return { ok: true };
}

export async function updateConversationNote(
  db: AppDatabase,
  conversationId: string,
  messageId: string,
  text: string,
  actorUserId: string,
): Promise<UpdateConversationNoteResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty_text" };
  }

  const row = await selectOne(
    db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId))),
  );

  if (!row) {
    return { ok: false, reason: "not_found" };
  }

  if (row.from !== "note") {
    return { ok: false, reason: "not_a_note" };
  }

  if (!row.authorUserId || row.authorUserId !== actorUserId) {
    return { ok: false, reason: "not_author" };
  }

  await db.update(messages).set({ text: trimmed }).where(eq(messages.id, messageId));

  const lastMessage = await selectOne(
    db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.sortOrder))
      .limit(1),
  );

  if (lastMessage?.id === messageId) {
    await db
      .update(conversations)
      .set({ preview: formatNotePreview(trimmed) })
      .where(eq(conversations.id, conversationId));
  }

  return { ok: true };
}
