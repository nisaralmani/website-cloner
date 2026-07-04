/**
 * Unified AI decision pipeline (Phase 21, Task 3).
 *
 * ONE entry point that both the chat pipeline (`ai-auto-reply.ts`) and the
 * email/Instagram pipeline (`ai-auto-responder.ts`) call after a reply is
 * generated. It ties together the three reusable engines without duplicating
 * their logic:
 *
 *   1. confidence scoring   (`@/lib/ai/confidence`)
 *   2. safety/threshold gate (`@/lib/ai/safety`)
 *   3. human-review queue    (`@/lib/ai/review-queue`)
 *   4. structured audit       (`@/lib/ai/audit-log`, decision phase)
 *
 * It does NOT redesign the AI architecture, change prompts, or change models.
 * It reuses the existing orchestrator's output. Callers keep ownership of the
 * actual delivery (insert message / SMTP / notes) — this only decides and
 * records; it never sends.
 */
import type { AppDatabase } from "@/db/client";
import { recordAiAudit } from "@/lib/ai/audit-log";
import {
  scoreConfidence,
  type ConfidenceResult,
  type ConfidenceSignals,
} from "@/lib/ai/confidence";
import {
  evaluateSafety,
  type SafetyDecision,
  type SafetySettings,
  type SafetySignals,
} from "@/lib/ai/safety";
import { enqueueAiReview, type AiReviewState } from "@/lib/ai/review-queue";

/** Order-intent keywords: a cheap, model-free heuristic for whether a message
 *  needs order context to be answered safely. Used by channels without a
 *  classifier (chat). General/policy questions do not match, so anonymous
 *  shoppers asking those are not gated. */
const ORDER_INTENT_RE =
  /\b(order|tracking|track|where('?s| is)?|deliver(y|ed)?|shipp?(ing|ed)?|refund|return|exchange|cancel|status|package|parcel)\b/i;

/** True when a free-text message appears to require order/customer context. */
export function messageNeedsOrderContext(text: string | null | undefined): boolean {
  return Boolean(text && ORDER_INTENT_RE.test(text));
}

/** Map a terminal safety decision to the review-queue state it produces. */
const REVIEW_STATE_BY_DECISION: Record<SafetyDecision, AiReviewState> = {
  AUTO_SEND: "auto_sent",
  CREATE_DRAFT: "draft_created",
  HUMAN_REVIEW: "pending_review",
  BLOCK_REPLY: "pending_review",
};

export interface UnifiedDecisionInput {
  db: AppDatabase;
  workspaceId: string;
  conversationId: string;
  channel: string;
  /** Per-workspace safety settings (structural subset of the agent config's `safety` block). */
  settings: SafetySettings;
  confidenceSignals: ConfidenceSignals;
  safetySignals: SafetySignals;
  /** The generated reply text, stored on the review row as the proposed draft. */
  draftText?: string | null;
  /** Message id of the persisted reply, if already known. */
  messageId?: string | null;
  /** Reply source, for the audit event. */
  replySource: "openai" | "template";
  /** Where merchant grounding came from, for the audit event. */
  groundingSource: string;
  /** Order/customer context source, for the audit event. */
  orderContextSource: string;
  /** Generation latency, for the audit event. */
  latencyMs?: number;
  /** Set false to compute + audit the decision without persisting a review row. Defaults true. */
  enqueue?: boolean;
}

export interface UnifiedDecisionResult {
  confidence: ConfidenceResult;
  decision: SafetyDecision;
  reasons: string[];
  reviewState: AiReviewState;
  reviewId: string | null;
}

/**
 * Run the unified confidence → safety → review → audit pipeline for one
 * generated reply. Returns the terminal decision; the caller performs the
 * matching delivery action.
 */
export async function runUnifiedAiDecision(
  input: UnifiedDecisionInput,
): Promise<UnifiedDecisionResult> {
  const confidence = scoreConfidence(input.confidenceSignals);
  const { decision, reasons } = evaluateSafety({
    confidenceScore: confidence.confidenceScore,
    settings: input.settings,
    signals: input.safetySignals,
  });
  const reviewState = REVIEW_STATE_BY_DECISION[decision];

  const combinedReason = [confidence.confidenceReason, ...reasons]
    .filter(Boolean)
    .join(" | ");

  let reviewId: string | null = null;
  if (input.enqueue !== false) {
    reviewId = await enqueueAiReview(input.db, {
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      messageId: input.messageId ?? null,
      channel: input.channel,
      state: reviewState,
      decision,
      reason: combinedReason,
      confidence: confidence.confidenceScore,
      confidenceLevel: confidence.confidenceLevel,
      draftText: input.draftText ?? null,
    });
  }

  // Decision-phase audit event (Task 5) — additive to the orchestrator's
  // generation-phase event; never throws into the reply path.
  recordAiAudit({
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    channel: input.channel,
    decision,
    provider: "openai",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    source: input.replySource,
    groundingSource: input.groundingSource,
    orderContextSource: input.orderContextSource,
    latencyMs: input.latencyMs ?? 0,
    success: true,
    phase: "decision",
    confidenceScore: confidence.confidenceScore,
    confidenceLevel: confidence.confidenceLevel,
    safetyDecision: decision,
    reviewStatus: reviewState,
  });

  return { confidence, decision, reasons, reviewState, reviewId };
}
