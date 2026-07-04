import { and, eq, isNull, lte } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { conversationReminders, conversations } from "@/db/schema";
import { publishConversationUpdated } from "@/lib/inbox/event-bus";
import { formatReminderPreview } from "@/lib/inbox/reminders";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { formatConversationTime } from "@/lib/inbox/time";
import { MARK_UNREAD_COUNT } from "@/lib/inbox/unread";

export type ProcessDueRemindersResult = {
  processedCount: number;
  conversationIds: string[];
};

export async function processDueRemindersForWorkspace(
  db: AppDatabase,
  workspaceId: string,
  now = new Date(),
): Promise<ProcessDueRemindersResult> {
  const dueRows = await selectAll(
    db
      .select({
        reminder: conversationReminders,
        conversation: conversations,
      })
      .from(conversationReminders)
      .innerJoin(conversations, eq(conversationReminders.conversationId, conversations.id))
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          isNull(conversationReminders.cancelledAt),
          isNull(conversationReminders.fulfilledAt),
          lte(conversationReminders.remindAt, now),
        ),
      ),
  );

  const conversationIds: string[] = [];

  for (const { reminder, conversation } of dueRows) {
    await db
      .update(conversationReminders)
      .set({ fulfilledAt: now })
      .where(eq(conversationReminders.id, reminder.id));

    const unread = conversation.unread > 0 ? conversation.unread : MARK_UNREAD_COUNT;

    await db
      .update(conversations)
      .set({
        preview: formatReminderPreview(reminder.note),
        timeLabel: formatConversationTime(now),
        unread,
        status: conversation.status === "resolved" ? "pending" : conversation.status,
      })
      .where(eq(conversations.id, conversation.id));

    conversationIds.push(conversation.id);
  }

  return {
    processedCount: conversationIds.length,
    conversationIds,
  };
}

export async function processDueRemindersAndPublish(
  db: AppDatabase,
  workspaceId: string,
  now = new Date(),
): Promise<ProcessDueRemindersResult> {
  const result = await processDueRemindersForWorkspace(db, workspaceId, now);

  if (result.processedCount > 0) {
    const conversationList = await fetchWorkspaceConversations(workspaceId);
    publishConversationUpdated(workspaceId, conversationList);
  }

  return result;
}
