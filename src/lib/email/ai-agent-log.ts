import { randomUUID } from "crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { aiAgentLog, conversationAi } from "@/db/schema";
import type { AgentDecision, EmailCategory, RiskLevel, Sentiment } from "@/lib/email/email-agent";

export interface AiAgentLogInput {
  workspaceId: string;
  conversationId: string | null;
  messageId?: string | null;
  category: string;
  sentiment: string;
  risk: string;
  isSpam: boolean;
  isVip: boolean;
  confidence: number;
  decision: string;
  reason: string;
  model: string;
  summary: string;
}

export async function logAiDecision(db: AppDatabase, entry: AiAgentLogInput): Promise<void> {
  try {
    await db.insert(aiAgentLog).values({
      id: randomUUID(),
      workspaceId: entry.workspaceId,
      conversationId: entry.conversationId,
      messageId: entry.messageId ?? null,
      category: entry.category,
      sentiment: entry.sentiment,
      risk: entry.risk,
      isSpam: entry.isSpam ? 1 : 0,
      isVip: entry.isVip ? 1 : 0,
      confidence: entry.confidence,
      decision: entry.decision,
      reason: entry.reason,
      model: entry.model,
      summary: entry.summary,
      createdAt: new Date(),
    });
  } catch {
    // best-effort
  }
}

export async function setConversationAi(
  db: AppDatabase,
  conversationId: string,
  input: {
    summary: string;
    sentiment: string;
    category: string;
    confidence: number;
    isVip: boolean;
  },
) {
  try {
    await db
      .insert(conversationAi)
      .values({
        conversationId,
        summary: input.summary,
        sentiment: input.sentiment,
        category: input.category,
        confidence: input.confidence,
        isVip: input.isVip ? 1 : 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: conversationAi.conversationId,
        set: {
          summary: input.summary,
          sentiment: input.sentiment,
          category: input.category,
          confidence: input.confidence,
          isVip: input.isVip ? 1 : 0,
          updatedAt: new Date(),
        },
      });
  } catch {
    // best-effort
  }
}

export async function getAiAgentMetrics(db: AppDatabase, workspaceId: string, days = 30) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await selectAll(
    db
      .select({
        decision: aiAgentLog.decision,
        count: sql<number>`count(*)`.mapWith(Number),
        avgConfidence: sql<number>`avg(${aiAgentLog.confidence})`.mapWith(Number),
      })
      .from(aiAgentLog)
      .where(and(eq(aiAgentLog.workspaceId, workspaceId), gte(aiAgentLog.createdAt, cutoff)))
      .groupBy(aiAgentLog.decision),
  );

  const by: Record<string, number> = {};
  let total = 0;
  let confSum = 0;
  for (const row of rows) {
    by[row.decision] = row.count;
    total += row.count;
    confSum += (row.avgConfidence || 0) * row.count;
  }

  if (!total) {
    return {
      total: 0,
      autoReplied: 0,
      drafted: 0,
      escalated: 0,
      spam: 0,
      ignored: 0,
      notesOnly: 0,
      autoResolutionRate: 0,
      escalationRate: 0,
      spamRate: 0,
      avgConfidence: 0,
    };
  }

  const autoReplied = by.auto_reply || 0;
  const drafted = by.draft_reply || 0;
  const escalated = by.escalate || 0;
  const spam = by.spam || 0;
  const ignored = by.ignore || 0;
  const notesOnly = by.note_only || 0;
  const human = total - spam - ignored;
  const pct = (value: number, base: number) => (base > 0 ? Math.round((value / base) * 100) : 0);

  return {
    total,
    autoReplied,
    drafted,
    escalated,
    spam,
    ignored,
    notesOnly,
    autoResolutionRate: pct(autoReplied, human),
    escalationRate: pct(escalated, human),
    spamRate: pct(spam, total),
    avgConfidence: Math.round(confSum / total),
  };
}

export type { AgentDecision, EmailCategory, RiskLevel, Sentiment };
