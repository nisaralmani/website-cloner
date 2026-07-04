import { and, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll, selectOne } from "@/db/client";
import { conversationSegments, conversations, subInboxes } from "@/db/schema";
import { fetchActiveSnoozeUntilMap, isConversationSnoozed } from "@/lib/inbox/conversation-snooze";
import { fetchSegmentsMapForConversations } from "@/lib/inbox/conversation-segments";

function formatBadgeCount(count: number): string {
  if (count <= 0) return "0";
  if (count > 99) return "99+";
  return String(count);
}

export type SubInboxUnreadCount = {
  id: string;
  unread: number;
};

export type InboxCounts = {
  mainInbox: number;
  getStarted: number;
  spam: number;
  shopify: number;
  notificationCount: string;
  totalUnread: number;
  subInboxes: SubInboxUnreadCount[];
};

export async function fetchInboxCounts(
  db: AppDatabase,
  workspaceId: string,
): Promise<InboxCounts> {
  const now = new Date();
  const rows = await db
    .select({
      id: conversations.id,
      unread: conversations.unread,
      status: conversations.status,
    })
    .from(conversations)
    .where(eq(conversations.workspaceId, workspaceId));

  const snoozeMap = await fetchActiveSnoozeUntilMap(db, workspaceId);

  let mainInbox = 0;
  let totalUnread = 0;

  for (const row of rows) {
    const snoozedUntil = snoozeMap.get(row.id);
    if (isConversationSnoozed(snoozedUntil, now)) {
      continue;
    }
    if (row.unread > 0) {
      mainInbox += 1;
      totalUnread += row.unread;
    }
  }

  const unassignedRow = await selectOne(
    db
      .select({ value: sql<number>`count(*)` })
      .from(conversations)
      .where(
        and(eq(conversations.workspaceId, workspaceId), eq(conversations.status, "unassigned")),
      ),
  );

  const getStarted = Number(unassignedRow?.value ?? 0);

  const spamRows = await db
    .select({ conversationId: conversationSegments.conversationId })
    .from(conversationSegments)
    .innerJoin(conversations, eq(conversationSegments.conversationId, conversations.id))
    .where(
      and(eq(conversations.workspaceId, workspaceId), eq(conversationSegments.segment, "spam")),
    );
  const spamConversationIds = new Set(spamRows.map((row) => row.conversationId));
  let spam = 0;
  for (const row of rows) {
    if (spamConversationIds.has(row.id) && row.unread > 0) {
      const snoozedUntil = snoozeMap.get(row.id);
      if (!isConversationSnoozed(snoozedUntil, now)) {
        spam += 1;
      }
    }
  }

  const shopifyRows = await db
    .select({ conversationId: conversationSegments.conversationId })
    .from(conversationSegments)
    .innerJoin(conversations, eq(conversationSegments.conversationId, conversations.id))
    .where(
      and(eq(conversations.workspaceId, workspaceId), eq(conversationSegments.segment, "shopify")),
    );
  const shopifyConversationIds = new Set(shopifyRows.map((row) => row.conversationId));
  let shopify = 0;
  for (const row of rows) {
    if (shopifyConversationIds.has(row.id) && row.unread > 0) {
      const snoozedUntil = snoozeMap.get(row.id);
      if (!isConversationSnoozed(snoozedUntil, now)) {
        shopify += 1;
      }
    }
  }

  const subInboxRows = await selectAll(
    db
      .select()
      .from(subInboxes)
      .where(and(eq(subInboxes.workspaceId, workspaceId), eq(subInboxes.enabled, 1))),
  );
  const conversationIds = rows.map((row) => row.id);
  const segmentsMap = await fetchSegmentsMapForConversations(db, conversationIds);
  const subInboxUnread: SubInboxUnreadCount[] = subInboxRows.map((subInbox) => {
    const segment = subInbox.segment?.trim().toLowerCase() ?? "";
    if (!segment) {
      return { id: subInbox.id, unread: 0 };
    }
    let unread = 0;
    for (const row of rows) {
      if (row.unread <= 0) continue;
      const snoozedUntil = snoozeMap.get(row.id);
      if (isConversationSnoozed(snoozedUntil, now)) continue;
      const segments = segmentsMap.get(row.id) ?? [];
      if (segments.some((value) => value.toLowerCase() === segment)) {
        unread += 1;
      }
    }
    return { id: subInbox.id, unread };
  });

  return {
    mainInbox,
    getStarted,
    spam,
    shopify,
    totalUnread,
    notificationCount: formatBadgeCount(totalUnread),
    subInboxes: subInboxUnread,
  };
}
