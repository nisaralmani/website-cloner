import { and, asc, eq, gt, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { conversationReminders, messages, users } from "@/db/schema";

function reminderJoinCondition() {
  return and(
    eq(messages.id, conversationReminders.messageId),
    isNull(conversationReminders.cancelledAt),
  );
}

export function selectConversationMessages(db: AppDatabase, conversationId: string) {
  return db
    .select({
      message: messages,
      author: users,
      reminder: conversationReminders,
    })
    .from(messages)
    .leftJoin(users, eq(messages.authorUserId, users.id))
    .leftJoin(conversationReminders, reminderJoinCondition())
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.sortOrder));
}

export function selectConversationMessagesAfter(
  db: AppDatabase,
  conversationId: string,
  afterSortOrder: number,
) {
  return db
    .select({
      message: messages,
      author: users,
      reminder: conversationReminders,
    })
    .from(messages)
    .leftJoin(users, eq(messages.authorUserId, users.id))
    .leftJoin(conversationReminders, reminderJoinCondition())
    .where(and(eq(messages.conversationId, conversationId), gt(messages.sortOrder, afterSortOrder)))
    .orderBy(asc(messages.sortOrder));
}

export function selectMessageWithAuthor(db: AppDatabase, messageId: string) {
  return db
    .select({
      message: messages,
      author: users,
      reminder: conversationReminders,
    })
    .from(messages)
    .leftJoin(users, eq(messages.authorUserId, users.id))
    .leftJoin(conversationReminders, reminderJoinCondition())
    .where(eq(messages.id, messageId));
}

export function selectMessageWithReminder(db: AppDatabase, messageId: string) {
  return selectMessageWithAuthor(db, messageId);
}

export function selectActiveConversationReminders(db: AppDatabase, conversationId: string) {
  return db
    .select({
      reminder: conversationReminders,
      author: users,
    })
    .from(conversationReminders)
    .innerJoin(users, eq(conversationReminders.authorUserId, users.id))
    .where(
      and(
        eq(conversationReminders.conversationId, conversationId),
        isNull(conversationReminders.cancelledAt),
        isNull(conversationReminders.fulfilledAt),
      ),
    )
    .orderBy(asc(conversationReminders.remindAt));
}
