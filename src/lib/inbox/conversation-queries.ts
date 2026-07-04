import { and, asc, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { conversations, users } from "@/db/schema";

export function selectWorkspaceConversationsWithAssignees(db: AppDatabase, workspaceId: string) {
  return db
    .select({
      conversation: conversations,
      assignee: users,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.assignedOperatorId, users.id))
    .where(eq(conversations.workspaceId, workspaceId))
    .orderBy(asc(conversations.sortOrder));
}

export function selectConversationWithAssignee(
  db: AppDatabase,
  conversationId: string,
  workspaceId: string,
) {
  return db
    .select({
      conversation: conversations,
      assignee: users,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.assignedOperatorId, users.id))
    .where(and(eq(conversations.id, conversationId), eq(conversations.workspaceId, workspaceId)));
}

export function selectConversationsWithAssignee(
  db: AppDatabase,
  workspaceId: string,
  conversationIds: string[],
) {
  return db
    .select({
      conversation: conversations,
      assignee: users,
    })
    .from(conversations)
    .leftJoin(users, eq(conversations.assignedOperatorId, users.id))
    .where(
      and(eq(conversations.workspaceId, workspaceId), inArray(conversations.id, conversationIds)),
    );
}
