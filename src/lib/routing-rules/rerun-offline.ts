import { asc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { conversations, routingRules, users } from "@/db/schema";
import { isRerunWhenOfflineEnabled } from "@/lib/inbox/routing-preferences";
import { isOperatorOnline } from "@/lib/workspaces/operators";
import { applyRoutingRulesOnConversation } from "@/lib/routing-rules/apply";

export async function rerunRoutingIfAssignedOperatorOffline(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
) {
  const enabled = await isRerunWhenOfflineEnabled(db, workspaceId);
  if (!enabled) {
    return false;
  }

  const conversation = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  const row = conversation[0];
  if (!row?.assignedOperatorId) {
    return false;
  }

  const operator = await db
    .select()
    .from(users)
    .where(eq(users.id, row.assignedOperatorId))
    .limit(1);

  const user = operator[0];
  if (user && isOperatorOnline(user)) {
    return false;
  }

  await db
    .update(conversations)
    .set({ assignedOperatorId: null })
    .where(eq(conversations.id, conversationId));

  const rules = await selectAll(
    db
      .select()
      .from(routingRules)
      .where(eq(routingRules.workspaceId, workspaceId))
      .orderBy(asc(routingRules.sortOrder)),
  );

  if (rules.length === 0) {
    return true;
  }

  await applyRoutingRulesOnConversation(db, workspaceId, conversationId, {});
  return true;
}
