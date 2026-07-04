/**
 * Shared AI execution audit logger (A3-T1 + Phase 24B).
 *
 * One reusable, channel-agnostic sink for structured AI audit events.
 * Phase 24B: routes through the shared component logger with request
 * correlation fields (requestId, workspaceId, conversationId).
 */

import { randomUUID } from "crypto";
import { getDb } from "@/db/client";
import { aiAgentLog } from "@/db/schema";
import { createComponentLogger } from "@/lib/logging/logger";
import { getRequestId } from "@/lib/logging/request-context";

const log = createComponentLogger("ai-audit");

/** Structured audit event for one AI generation request. */
export interface AiAuditEvent {
  timestamp: string;
  requestId?: string;
  workspaceId: string;
  conversationId: string;
  channel: string;
  decision: string;
  provider: string;
  model: string;
  source: "openai" | "template";
  groundingSource: string;
  orderContextSource: string;
  latencyMs: number;
  success: boolean;
  error?: string | null;
  phase?: "generation" | "decision";
  confidenceScore?: number;
  confidenceLevel?: string;
  safetyDecision?: string;
  reviewStatus?: string;
  /** Token usage when reported by the provider (optional). */
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export type AiAuditInput = Omit<AiAuditEvent, "timestamp" | "requestId"> & {
  requestId?: string;
};

/**
 * Emit one structured AI audit event. Best-effort and side-effect-only —
 * callers do not await a sink and this never throws.
 */
export function recordAiAudit(input: AiAuditInput): void {
  try {
    const requestId = input.requestId ?? getRequestId();

    log.info("ai_audit", {
      event: "ai_audit",
      requestId,
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      channel: input.channel,
      decision: input.decision,
      model: input.model,
      source: input.source,
      latency: input.latencyMs,
      latencyMs: input.latencyMs,
      success: input.success,
      phase: input.phase,
      confidenceScore: input.confidenceScore,
      confidenceLevel: input.confidenceLevel,
      safetyDecision: input.safetyDecision,
      reviewStatus: input.reviewStatus,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      totalTokens: input.totalTokens,
      error: input.error ?? undefined,
    });

    getDb()
      .then(async (db) => {
        try {
          await db.insert(aiAgentLog).values({
            id: randomUUID(),
            workspaceId: input.workspaceId,
            conversationId: input.conversationId,
            decision: input.safetyDecision ?? input.decision,
            confidence: input.confidenceScore ?? 0,
            reason: input.error ?? (input.success ? "success" : "failed"),
            model: input.model,
            summary: `Phase: ${input.phase ?? "unknown"}`,
            category: input.confidenceLevel ?? "unknown",
            channel: input.channel,
            latencyMs: input.latencyMs,
            groundingSource: input.groundingSource,
            reviewStatus: input.reviewStatus ?? null,
            error: input.error ?? null,
            createdAt: new Date(),
          });
        } catch (dbErr) {
          log.error("ai_audit_db_error", {
            event: "ai_audit_db_error",
            error: dbErr instanceof Error ? dbErr.message : String(dbErr),
          });
        }
      })
      .catch(() => {});
  } catch {
    // Auditing must never break the reply path.
  }
}
