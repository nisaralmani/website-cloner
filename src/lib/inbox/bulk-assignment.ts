import { and, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { conversations } from "@/db/schema";
import {
  isWorkspaceOperator,
  parseAssignedOperatorInput,
} from "@/lib/inbox/conversation-assignment";
import { toConversationWithAssignee } from "@/lib/inbox/mappers";
import { selectConversationsWithAssignee } from "@/lib/inbox/conversation-queries";
import { fetchSegmentsMapForConversations } from "@/lib/inbox/conversation-segments";

export const MAX_BULK_ASSIGN_COUNT = 50;

export function parseBulkConversationIds(
  value: unknown,
): { conversationIds: string[] } | { error: string } {
  if (!Array.isArray(value)) {
    return { error: "conversationIds must be an array" };
  }

  if (value.length === 0) {
    return { error: "conversationIds must not be empty" };
  }

  if (value.length > MAX_BULK_ASSIGN_COUNT) {
    return { error: `conversationIds must not exceed ${MAX_BULK_ASSIGN_COUNT} items` };
  }

  const conversationIds: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return { error: "Each conversation id must be a string" };
    }

    const trimmed = item.trim();
    if (!trimmed) {
      return { error: "Conversation ids must not be empty" };
    }

    if (trimmed.length > 64) {
      return { error: "Conversation id is too long" };
    }

    conversationIds.push(trimmed);
  }

  return { conversationIds: [...new Set(conversationIds)] };
}

export async function bulkAssignConversations(
  db: AppDatabase,
  workspaceId: string,
  conversationIds: string[],
  assignedOperatorId: string | null,
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

  await db
    .update(conversations)
    .set({ assignedOperatorId })
    .where(
      and(
        eq(conversations.workspaceId, workspaceId),
        inArray(conversations.id, conversationIds),
      ),
    );

  const joined = await selectAll(selectConversationsWithAssignee(db, workspaceId, conversationIds));
  const segmentsByConversation = await fetchSegmentsMapForConversations(db, conversationIds);

  const updatedConversations = joined
    .filter((row) => conversationIds.includes(row.conversation.id))
    .map((row) =>
      toConversationWithAssignee(
        row.conversation,
        row.assignee,
        segmentsByConversation.get(row.conversation.id) ?? [],
      ),
    );

  return {
    ok: true as const,
    updatedCount: updatedConversations.length,
    conversations: updatedConversations,
  };
}

export async function validateBulkAssignOperator(
  db: AppDatabase,
  workspaceId: string,
  assignedOperatorId: string | null,
): Promise<{ operatorId: string | null } | { error: string }> {
  const parsed = parseAssignedOperatorInput(assignedOperatorId);
  if ("error" in parsed) {
    return parsed;
  }

  if (parsed.operatorId) {
    const isMember = await isWorkspaceOperator(db, workspaceId, parsed.operatorId);
    if (!isMember) {
      return { error: "Operator is not in this workspace" };
    }
  }

  return { operatorId: parsed.operatorId };
}
