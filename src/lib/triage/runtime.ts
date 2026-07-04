import { and, asc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import {
  conversationSegments,
  conversationVisitorData,
  conversations,
  triageRules,
} from "@/db/schema";
import { normalizeConversationSegment } from "@/lib/inbox/conversation-segments";

type TriageRuleRow = typeof triageRules.$inferSelect;

export type BlockTriageOutcome =
  | { type: "none" }
  | { type: "drop"; ruleId: string; ruleName: string }
  | { type: "spam"; ruleId: string; ruleName: string };

export type SortTriageResult = {
  appliedRuleIds: string[];
  appliedActions: string[];
};

export function triageRuleMatches(matchContains: string | null, messageText: string) {
  if (!matchContains) {
    return false;
  }

  return messageText.toLowerCase().includes(matchContains.toLowerCase());
}

function segmentTokenFromRule(rule: TriageRuleRow) {
  const token = rule.matchContains?.trim() || rule.name.trim();
  return normalizeConversationSegment(token.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
}

function visitorDataKeyFromRule(rule: TriageRuleRow) {
  const token = rule.matchContains?.trim() || rule.name.trim();
  return token.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_|_$/g, "").slice(0, 64);
}

async function loadEnabledRules(db: AppDatabase, workspaceId: string, ruleset: "block" | "sort") {
  return selectAll(
    db
      .select()
      .from(triageRules)
      .where(
        and(
          eq(triageRules.workspaceId, workspaceId),
          eq(triageRules.ruleset, ruleset),
          eq(triageRules.enabled, 1),
        ),
      )
      .orderBy(asc(triageRules.sortOrder), asc(triageRules.name)),
  );
}

async function addSegment(db: AppDatabase, conversationId: string, segment: string) {
  const normalized = normalizeConversationSegment(segment);
  if (!normalized) {
    return;
  }

  await db
    .insert(conversationSegments)
    .values({
      conversationId,
      segment: normalized,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();
}

async function upsertVisitorData(
  db: AppDatabase,
  conversationId: string,
  key: string,
  value: string,
) {
  const trimmedKey = key.trim();
  const trimmedValue = value.trim();
  if (!trimmedKey || !trimmedValue) {
    return;
  }

  await db
    .insert(conversationVisitorData)
    .values({
      conversationId,
      dataKey: trimmedKey.slice(0, 64),
      dataValue: trimmedValue.slice(0, 500),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [conversationVisitorData.conversationId, conversationVisitorData.dataKey],
      set: {
        dataValue: trimmedValue.slice(0, 500),
        updatedAt: new Date(),
      },
    });
}

export async function evaluateBlockTriage(
  db: AppDatabase,
  workspaceId: string,
  messageText: string,
): Promise<BlockTriageOutcome> {
  const rules = await loadEnabledRules(db, workspaceId, "block");

  for (const rule of rules) {
    if (!triageRuleMatches(rule.matchContains, messageText)) {
      continue;
    }

    if (rule.action === "Drop Message") {
      return { type: "drop", ruleId: rule.id, ruleName: rule.name };
    }

    if (rule.action === "Send to Spam") {
      return { type: "spam", ruleId: rule.id, ruleName: rule.name };
    }
  }

  return { type: "none" };
}

export async function applySortTriage(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  messageText: string,
): Promise<SortTriageResult> {
  const rules = await loadEnabledRules(db, workspaceId, "sort");
  const appliedRuleIds: string[] = [];
  const appliedActions: string[] = [];

  for (const rule of rules) {
    if (!triageRuleMatches(rule.matchContains, messageText)) {
      continue;
    }

    if (rule.action === "Assign Segment") {
      const segment = segmentTokenFromRule(rule);
      if (segment) {
        await addSegment(db, conversationId, segment);
        appliedRuleIds.push(rule.id);
        appliedActions.push(`segment:${segment}`);
      }
      continue;
    }

    if (rule.action === "Set Data Value") {
      const key = visitorDataKeyFromRule(rule);
      if (key) {
        await upsertVisitorData(db, conversationId, key, messageText);
        appliedRuleIds.push(rule.id);
        appliedActions.push(`data:${key}`);
      }
      continue;
    }

    if (rule.action === "Resolve Conversation") {
      await db
        .update(conversations)
        .set({ status: "resolved" })
        .where(eq(conversations.id, conversationId));
      appliedRuleIds.push(rule.id);
      appliedActions.push("resolved");
    }
  }

  return { appliedRuleIds, appliedActions };
}

export async function applySpamTag(db: AppDatabase, conversationId: string) {
  await addSegment(db, conversationId, "spam");
}
