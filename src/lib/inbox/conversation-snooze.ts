import { and, asc, eq, gt, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { conversationReminders, conversations } from "@/db/schema";

export async function fetchActiveSnoozeUntilMap(
  db: AppDatabase,
  workspaceId: string,
): Promise<Map<string, Date>> {
  const now = new Date();
  const rows = await selectAll(
    db
      .select({
        conversationId: conversationReminders.conversationId,
        remindAt: conversationReminders.remindAt,
      })
      .from(conversationReminders)
      .innerJoin(conversations, eq(conversationReminders.conversationId, conversations.id))
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          isNull(conversationReminders.cancelledAt),
          isNull(conversationReminders.fulfilledAt),
          gt(conversationReminders.remindAt, now),
        ),
      )
      .orderBy(asc(conversationReminders.remindAt)),
  );

  const map = new Map<string, Date>();
  for (const row of rows) {
    if (!map.has(row.conversationId)) {
      map.set(row.conversationId, row.remindAt);
    }
  }

  return map;
}

export function isConversationSnoozed(snoozedUntil: Date | undefined, now = new Date()): boolean {
  return Boolean(snoozedUntil && snoozedUntil.getTime() > now.getTime());
}
