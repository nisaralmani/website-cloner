import { and, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { conversations } from "@/db/schema";
import { isConversationStatus } from "@/lib/inbox/conversation-status";
import { toConversationWithAssignee } from "@/lib/inbox/mappers";
import { selectConversationsWithAssignee } from "@/lib/inbox/conversation-queries";
import { fetchSegmentsMapForConversations } from "@/lib/inbox/conversation-segments";
import { parseBulkConversationIds } from "@/lib/inbox/bulk-assignment";

export { parseBulkConversationIds };

export async function bulkUpdateConversationStatus(
  db: AppDatabase,
  workspaceId: string,
  conversationIds: string[],
  status: string,
) {
  if (!isConversationStatus(status)) {
    return { ok: false as const, error: "Invalid conversation status" };
  }

  const rows = await selectAll(
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          inArray(conversations.id, conversationIds),
        ),
      ),
  );

  if (rows.length !== conversationIds.length) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await db
    .update(conversations)
    .set({ status })
    .where(
      and(
        eq(conversations.workspaceId, workspaceId),
        inArray(conversations.id, conversationIds),
      ),
    );

  const joined = await selectAll(
    selectConversationsWithAssignee(db, workspaceId, conversationIds),
  );
  const segmentsMap = await fetchSegmentsMapForConversations(
    db,
    joined.map(({ conversation }) => conversation.id),
  );

  return {
    ok: true as const,
    conversations: joined.map(({ conversation, assignee }) =>
      toConversationWithAssignee(
        conversation,
        assignee,
        segmentsMap.get(conversation.id) ?? [],
      ),
    ),
  };
}
