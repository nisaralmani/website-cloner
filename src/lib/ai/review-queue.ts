/**
 * AI human-review queue — backend support only (Phase 21, Task 4).
 *
 * A reusable, channel-agnostic review lifecycle for AI-generated replies. There
 * is NO UI in this phase — this module only persists and mutates review state so
 * a future operator UI (or an API) can read/act on it.
 *
 * Lifecycle states:
 *   pending_review  — needs a human before anything goes to the customer
 *   approved        — a human approved the draft (to be sent by the caller)
 *   rejected        — a human rejected the draft (nothing sent)
 *   edited          — a human edited the draft before approving/sending
 *   auto_sent       — safety allowed AUTO_SEND; recorded for audit/history
 *   draft_created   — a draft was created for the operator (no auto-send)
 *
 * All writes are best-effort (mirrors `logAiDecision`) so the review queue can
 * never break the reply path.
 */
import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll, selectOne } from "@/db/client";
import { aiReviewQueue } from "@/db/schema";

export const AI_REVIEW_STATES = [
  "pending_review",
  "approved",
  "rejected",
  "edited",
  "auto_sent",
  "draft_created",
  "published",
] as const;
export type AiReviewState = (typeof AI_REVIEW_STATES)[number];

export interface EnqueueAiReviewInput {
  workspaceId: string;
  conversationId: string | null;
  messageId?: string | null;
  channel: string;
  state: AiReviewState;
  /** Safety decision that produced this row (AUTO_SEND | CREATE_DRAFT | HUMAN_REVIEW | BLOCK_REPLY). */
  decision: string;
  reason: string;
  confidence: number;
  confidenceLevel: string;
  /** The proposed reply text (draft), if any. */
  draftText?: string | null;
  reviewer?: string | null;
}

/** A resolved state closes the row and stamps `resolvedAt`. */
function isResolvedState(state: AiReviewState): boolean {
  return (
    state === "approved" ||
    state === "rejected" ||
    state === "edited" ||
    state === "auto_sent" ||
    state === "published"
  );
}

/**
 * Insert a review-queue row. Returns the new row id, or null on failure
 * (best-effort — never throws into the reply path).
 */
export async function enqueueAiReview(
  db: AppDatabase,
  input: EnqueueAiReviewInput,
): Promise<string | null> {
  try {
    const id = randomUUID();
    const now = new Date();
    await db.insert(aiReviewQueue).values({
      id,
      workspaceId: input.workspaceId,
      conversationId: input.conversationId,
      messageId: input.messageId ?? null,
      channel: input.channel,
      state: input.state,
      decision: input.decision,
      reason: input.reason,
      confidence: Math.max(0, Math.min(100, Math.round(input.confidence))),
      confidenceLevel: input.confidenceLevel,
      draftText: input.draftText ?? null,
      reviewer: input.reviewer ?? null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: isResolvedState(input.state) ? now : null,
    });
    return id;
  } catch (err) {
    console.error("enqueueAiReview error:", err);
    // best-effort — review queue must never break the reply path.
    return null;
  }
}

export interface UpdateAiReviewInput {
  state: AiReviewState;
  reviewer?: string | null;
  draftText?: string | null;
  reason?: string | null;
}

/**
 * Transition a review row to a new state (approve/reject/edit/etc.).
 * Best-effort; returns true on success.
 */
export async function updateAiReviewState(
  db: AppDatabase,
  id: string,
  input: UpdateAiReviewInput,
): Promise<boolean> {
  try {
    const now = new Date();
    const patch: Record<string, unknown> = {
      state: input.state,
      updatedAt: now,
      resolvedAt: isResolvedState(input.state) ? now : null,
    };
    if (input.reviewer !== undefined) patch.reviewer = input.reviewer;
    if (input.draftText !== undefined) patch.draftText = input.draftText;
    if (input.reason !== undefined) patch.reason = input.reason;
    await db.update(aiReviewQueue).set(patch).where(eq(aiReviewQueue.id, id));
    return true;
  } catch {
    return false;
  }
}

/** Fetch a single review row by id (workspace-scoped). */
export async function getAiReview(db: AppDatabase, workspaceId: string, id: string) {
  return selectOne(
    db
      .select()
      .from(aiReviewQueue)
      .where(and(eq(aiReviewQueue.id, id), eq(aiReviewQueue.workspaceId, workspaceId))),
  );
}

/** List pending reviews for a workspace, newest first. */
export async function listPendingAiReviews(db: AppDatabase, workspaceId: string, limit = 100) {
  return selectAll(
    db
      .select()
      .from(aiReviewQueue)
      .where(
        and(
          eq(aiReviewQueue.workspaceId, workspaceId),
          eq(aiReviewQueue.state, "pending_review"),
        ),
      )
      .orderBy(desc(aiReviewQueue.createdAt))
      .limit(limit),
  );
}
