import type { AppDatabase } from "@/db/client";
import { getAiReview, listPendingAiReviews, updateAiReviewState } from "@/lib/ai/review-queue";
import { insertConversationMessage } from "@/lib/inbox/conversation-messages";
import {
  publishConversationUpdated,
  publishReviewUpdated,
} from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { recordAiAudit } from "@/lib/ai/audit-log";
import { reportFailure } from "@/lib/reliability/failure-reporter";

export async function getPendingReviews(db: AppDatabase, workspaceId: string) {
  return listPendingAiReviews(db, workspaceId);
}

export async function getReviewDetails(db: AppDatabase, workspaceId: string, reviewId: string) {
  return getAiReview(db, workspaceId, reviewId);
}

export async function approveReview(
  db: AppDatabase,
  workspaceId: string,
  reviewId: string,
  reviewerId: string
) {
  const review = await getAiReview(db, workspaceId, reviewId);
  if (!review) throw new Error("Review not found");

  const success = await updateAiReviewState(db, reviewId, { state: "approved", reviewer: reviewerId });
  if (success) {
    recordAiAudit({
      workspaceId,
      conversationId: review.conversationId ?? "",
      channel: review.channel,
      decision: review.decision,
      provider: "openai", // defaulting
      model: "unknown",
      source: "openai",
      groundingSource: "unknown",
      orderContextSource: "none",
      latencyMs: 0,
      success: true,
      phase: "decision",
      confidenceScore: review.confidence,
      confidenceLevel: review.confidenceLevel,
      safetyDecision: review.decision,
      reviewStatus: "approved",
    });
  }
  return success;
}

export async function rejectReview(
  db: AppDatabase,
  workspaceId: string,
  reviewId: string,
  reviewerId: string
) {
  const review = await getAiReview(db, workspaceId, reviewId);
  if (!review) throw new Error("Review not found");

  const success = await updateAiReviewState(db, reviewId, { state: "rejected", reviewer: reviewerId });
  if (success) {
    recordAiAudit({
      workspaceId,
      conversationId: review.conversationId ?? "",
      channel: review.channel,
      decision: review.decision,
      provider: "openai",
      model: "unknown",
      source: "openai",
      groundingSource: "unknown",
      orderContextSource: "none",
      latencyMs: 0,
      success: true,
      phase: "decision",
      confidenceScore: review.confidence,
      confidenceLevel: review.confidenceLevel,
      safetyDecision: review.decision,
      reviewStatus: "rejected",
    });
  }
  return success;
}

export async function editReview(
  db: AppDatabase,
  workspaceId: string,
  reviewId: string,
  reviewerId: string,
  newDraftText: string
) {
  const review = await getAiReview(db, workspaceId, reviewId);
  if (!review) throw new Error("Review not found");

  const success = await updateAiReviewState(db, reviewId, {
    state: "edited",
    reviewer: reviewerId,
    draftText: newDraftText,
  });
  if (success) {
    recordAiAudit({
      workspaceId,
      conversationId: review.conversationId ?? "",
      channel: review.channel,
      decision: review.decision,
      provider: "openai",
      model: "unknown",
      source: "openai",
      groundingSource: "unknown",
      orderContextSource: "none",
      latencyMs: 0,
      success: true,
      phase: "decision",
      confidenceScore: review.confidence,
      confidenceLevel: review.confidenceLevel,
      safetyDecision: review.decision,
      reviewStatus: "edited",
    });
  }
  return success;
}

export async function publishApprovedReview(
  db: AppDatabase,
  workspaceId: string,
  reviewId: string,
  reviewerId: string
) {
  const review = await getAiReview(db, workspaceId, reviewId);
  if (!review) throw new Error("Review not found");
  if (!review.draftText) throw new Error("Review has no draft text to publish");
  if (!review.conversationId) throw new Error("Review has no conversation to publish to");

  // Idempotency guard: only an approved-but-unsent review may be published.
  // Without this, a double-click / retry re-inserts the customer-facing message
  // (the send below), delivering the AI reply to the customer more than once.
  // The publish route surfaces a falsy return as "invalid state" (400).
  if (review.state !== "approved") {
    return false;
  }

  // Record it in the audit history with the reviewer ID
  recordAiAudit({
    workspaceId,
    conversationId: review.conversationId,
    channel: review.channel,
    decision: review.decision,
    provider: "openai",
    model: "unknown",
    source: "openai",
    groundingSource: "unknown",
    orderContextSource: "none",
    latencyMs: 0,
    success: true,
    phase: "decision",
    confidenceScore: review.confidence,
    confidenceLevel: review.confidenceLevel,
    safetyDecision: review.decision,
    reviewStatus: "published",
    error: `Published by reviewer: ${reviewerId}`, // Storing reviewer ID in audit logs for audit purposes
  });

  // Send the customer-facing message through the existing AI delivery pipeline
  const apiMessage = await insertConversationMessage(db, review.conversationId, "operator", review.draftText);
  if (!apiMessage) {
    throw new Error("Failed to insert conversation message");
  }

  // Publish SSE events
  publishReviewUpdated(workspaceId, review.conversationId, [apiMessage]);
  
  // Phase 24D — this SSE conversation-list refresh was previously a silent
  // `.catch(() => {})`. Failures are now reported with correlation instead of
  // swallowed (still non-throwing / fire-and-forget — the publish message
  // already reached clients above).
  fetchWorkspaceConversations(workspaceId)
    .then((conversationList) => {
      publishConversationUpdated(workspaceId, conversationList);
    })
    .catch((error) => {
      reportFailure({
        error,
        component: "ai.review-service.publishApprovedReview",
        workspaceId,
        conversationId: review.conversationId,
        capture: false,
        extra: { stage: "sse_conversation_refresh" },
      });
    });

  // Terminal state after a successful human publish. Distinct from "approved"
  // so the review leaves the publishable set (the client only offers "Publish"
  // for state === "approved") and cannot be re-sent.
  return updateAiReviewState(db, reviewId, { state: "published", reviewer: reviewerId });
}

export async function reopenReview(
  db: AppDatabase,
  workspaceId: string,
  reviewId: string,
  reviewerId: string
) {
  const review = await getAiReview(db, workspaceId, reviewId);
  if (!review) throw new Error("Review not found");

  const success = await updateAiReviewState(db, reviewId, { state: "pending_review", reviewer: reviewerId });
  if (success) {
    recordAiAudit({
      workspaceId,
      conversationId: review.conversationId ?? "",
      channel: review.channel,
      decision: review.decision,
      provider: "openai",
      model: "unknown",
      source: "openai",
      groundingSource: "unknown",
      orderContextSource: "none",
      latencyMs: 0,
      success: true,
      phase: "decision",
      confidenceScore: review.confidence,
      confidenceLevel: review.confidenceLevel,
      safetyDecision: review.decision,
      reviewStatus: "pending_review",
    });
  }
  return success;
}
