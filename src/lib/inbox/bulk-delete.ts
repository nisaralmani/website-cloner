import { and, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { conversations } from "@/db/schema";
import { parseBulkConversationIds } from "@/lib/inbox/bulk-assignment";
import { deleteConversation } from "@/lib/inbox/delete-conversation";

export { parseBulkConversationIds };

export async function bulkDeleteConversations(
  db: AppDatabase,
  workspaceId: string,
  conversationIds: string[],
) {
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

  const deletedIds: string[] = [];
  for (const id of conversationIds) {
    const result = await deleteConversation(db, workspaceId, id);
    if (result.ok) {
      deletedIds.push(id);
    }
  }

  return { ok: true as const, deletedIds };
}
