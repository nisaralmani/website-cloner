import { and, asc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { conversations, routingRules, users, workspaceMembers } from "@/db/schema";
import { isRoutingRulesEnabled } from "@/lib/inbox/routing-preferences";
import { isOperatorOnline } from "@/lib/workspaces/operators";

type RoutingContext = {
  pageUrl?: string | null;
  firstMessage?: string | null;
};

function routingHaystack(context: RoutingContext) {
  return `${context.pageUrl ?? ""} ${context.firstMessage ?? ""}`.toLowerCase();
}

function ruleMatches(rule: { matchContains: string | null }, context: RoutingContext) {
  const needle = rule.matchContains?.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return routingHaystack(context).includes(needle);
}

async function pickRoundRobinOperator(db: AppDatabase, workspaceId: string) {
  const rows = await selectAll(
    db
      .select({
        userId: workspaceMembers.userId,
        user: users,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId))
      .orderBy(asc(workspaceMembers.userId)),
  );

  if (rows.length === 0) {
    return null;
  }

  const online = rows.filter((row) => isOperatorOnline(row.user));
  const pool = online.length > 0 ? online : rows;
  return pool[0]?.userId ?? null;
}

export async function applyRoutingRulesOnConversation(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  context: RoutingContext = {},
) {
  const masterEnabled = await isRoutingRulesEnabled(db, workspaceId);
  if (!masterEnabled) {
    return { appliedRuleId: null, assignedOperatorId: null };
  }

  const rules = await selectAll(
    db
      .select()
      .from(routingRules)
      .where(and(eq(routingRules.workspaceId, workspaceId), eq(routingRules.enabled, 1)))
      .orderBy(asc(routingRules.sortOrder)),
  );

  for (const rule of rules) {
    if (!ruleMatches(rule, context)) {
      continue;
    }

    if (rule.action === "Round Robin" || rule.action === "Assign to Team") {
      const operatorId = await pickRoundRobinOperator(db, workspaceId);
      if (operatorId) {
        await db
          .update(conversations)
          .set({ assignedOperatorId: operatorId })
          .where(eq(conversations.id, conversationId));
      }
      return { appliedRuleId: rule.id, assignedOperatorId: operatorId };
    }
  }

  return { appliedRuleId: null, assignedOperatorId: null };
}
