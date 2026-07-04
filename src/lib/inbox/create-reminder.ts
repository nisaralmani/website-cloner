import { randomUUID } from "crypto";
import { and, eq, max } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversationReminders, conversations, messages } from "@/db/schema";
import { toApiMessage, type ApiMessage } from "@/lib/inbox/mappers";
import { selectMessageWithReminder } from "@/lib/inbox/message-queries";
import { formatReminderPreview } from "@/lib/inbox/reminders";
import { formatConversationTime, formatMessageTime } from "@/lib/inbox/time";

export async function createConversationReminder(
  db: AppDatabase,
  conversationId: string,
  authorUserId: string,
  note: string,
  remindAt: Date,
): Promise<{ message: ApiMessage; reminderId: string } | null> {
  const [maxOrderRow] = await db
    .select({ value: max(messages.sortOrder) })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  const now = new Date();
  const messageId = randomUUID();
  const reminderId = randomUUID();
  const sortOrder = (maxOrderRow?.value ?? -1) + 1;
  const timeLabel = formatMessageTime(now);

  await db.insert(messages).values({
    id: messageId,
    conversationId,
    from: "reminder",
    text: note,
    timeLabel,
    sortOrder,
    authorUserId,
  });

  await db.insert(conversationReminders).values({
    id: reminderId,
    conversationId,
    messageId,
    authorUserId,
    remindAt,
    note,
    createdAt: now,
  });

  await db
    .update(conversations)
    .set({
      preview: formatReminderPreview(note),
      timeLabel: formatConversationTime(now),
    })
    .where(eq(conversations.id, conversationId));

  const joined = await selectOne(selectMessageWithReminder(db, messageId));
  if (!joined) {
    return null;
  }

  return {
    message: toApiMessage(joined.message, joined.author, joined.reminder),
    reminderId,
  };
}

export async function cancelConversationReminder(
  db: AppDatabase,
  conversationId: string,
  reminderId: string,
): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  const row = await selectOne(
    db
      .select()
      .from(conversationReminders)
      .where(
        and(
          eq(conversationReminders.id, reminderId),
          eq(conversationReminders.conversationId, conversationId),
        ),
      ),
  );

  if (!row || row.cancelledAt) {
    return { ok: false, reason: "not_found" };
  }

  await db
    .update(conversationReminders)
    .set({ cancelledAt: new Date() })
    .where(eq(conversationReminders.id, reminderId));

  return { ok: true };
}
