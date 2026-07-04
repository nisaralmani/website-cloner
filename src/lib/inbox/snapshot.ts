import { and, eq } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { conversations, subInboxes } from "@/db/schema";
import { toApiMessage, toConversationWithAssignee } from "@/lib/inbox/mappers";
import { selectWorkspaceConversationsWithAssignees } from "@/lib/inbox/conversation-queries";
import { fetchSegmentsMapForConversations } from "@/lib/inbox/conversation-segments";
import { fetchActiveSnoozeUntilMap, isConversationSnoozed } from "@/lib/inbox/conversation-snooze";
import { selectConversationMessagesAfter } from "@/lib/inbox/message-queries";

export type ConversationListSort = "recent" | "oldest" | "unread";

type FetchWorkspaceConversationsOptions = {
  includeSnoozed?: boolean;
  segment?: string;
  subInboxId?: string;
  query?: string;
  status?: string;
  assignedOperatorId?: string;
  sort?: ConversationListSort;
};

function sortConversations<T extends { unread: number }>(
  list: T[],
  sort: ConversationListSort = "recent",
): T[] {
  if (sort === "oldest") {
    return list;
  }
  if (sort === "unread") {
    return [...list].sort((a, b) => b.unread - a.unread || 0);
  }
  return [...list].reverse();
}

export async function fetchWorkspaceConversations(
  workspaceId: string,
  options: FetchWorkspaceConversationsOptions = {},
) {
  const db = await getDb();
  const rows = await selectAll(selectWorkspaceConversationsWithAssignees(db, workspaceId));
  const conversationIds = rows.map(({ conversation }) => conversation.id);
  const segmentsMap = await fetchSegmentsMapForConversations(db, conversationIds);
  const snoozeMap = await fetchActiveSnoozeUntilMap(db, workspaceId);
  const now = new Date();

  let segmentFilter = options.segment?.trim().toLowerCase();
  const queryFilter = options.query?.trim().toLowerCase() ?? "";
  const statusFilter = options.status?.trim().toLowerCase();
  const assignedOperatorFilter = options.assignedOperatorId?.trim();
  if (options.subInboxId) {
    const subInbox = await selectOne(
      db
        .select({ segment: subInboxes.segment })
        .from(subInboxes)
        .where(and(eq(subInboxes.id, options.subInboxId), eq(subInboxes.workspaceId, workspaceId))),
    );
    if (subInbox?.segment) {
      segmentFilter = subInbox.segment.trim().toLowerCase();
    }
  }

  const { listPendingAiReviews } = await import("@/lib/ai/review-queue");
  const pendingReviews = await listPendingAiReviews(db, workspaceId);
  const pendingReviewMap = new Map<string, "pending_review">(
    pendingReviews
      .filter((r) => r.conversationId)
      .map((r) => [r.conversationId as string, "pending_review"])
  );

  const filtered = rows
    .map(({ conversation, assignee }) => {
      const snoozedUntil = snoozeMap.get(conversation.id);
      const conv = toConversationWithAssignee(
          conversation,
          assignee,
          segmentsMap.get(conversation.id) ?? [],
      );
      
      const reviewState = pendingReviewMap.get(conversation.id);
      if (reviewState) {
        conv.aiReviewState = reviewState;
      }

      return {
        ...conv,
        snoozedUntil: snoozedUntil?.toISOString() ?? null,
      };
    })
    .filter((conversation) => {
      if (
        !options.includeSnoozed &&
        isConversationSnoozed(
          conversation.snoozedUntil ? new Date(conversation.snoozedUntil) : undefined,
          now,
        )
      ) {
        return false;
      }
      if (queryFilter) {
        const haystack = `${conversation.name} ${conversation.preview}`.toLowerCase();
        if (!haystack.includes(queryFilter)) {
          return false;
        }
      }
      if (statusFilter && conversation.status.toLowerCase() !== statusFilter) {
        return false;
      }
      if (assignedOperatorFilter) {
        if (assignedOperatorFilter === "none") {
          if (conversation.assignee) {
            return false;
          }
        } else if (conversation.assignee?.id !== assignedOperatorFilter) {
          return false;
        }
      }
      if (!segmentFilter) {
        return true;
      }
      return (conversation.segments ?? []).some(
        (segment) => segment.toLowerCase() === segmentFilter,
      );
    });

  return sortConversations(filtered, options.sort ?? "recent");
}

export async function fetchConversationMessagesAfter(
  workspaceId: string,
  conversationId: string,
  afterSortOrder: number,
) {
  const db = await getDb();
  const conversation = await selectOne(
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(eq(conversations.id, conversationId), eq(conversations.workspaceId, workspaceId)),
      ),
  );

  if (!conversation) {
    return [];
  }

  const rows = await selectAll(selectConversationMessagesAfter(db, conversationId, afterSortOrder));

  return rows.map(({ message, author, reminder }) => toApiMessage(message, author, reminder));
}
