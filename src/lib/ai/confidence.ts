/**
 * Reusable AI confidence scoring engine (Phase 21, Task 1).
 *
 * Produces a single, explainable 0-100 confidence score for a generated AI
 * reply from signals that already exist in the pipeline. It is a PURE,
 * synchronous function — no DB, no network, no model call, no prompt change.
 * It does NOT decide what to do with the score; that is the safety/threshold
 * layer's job (`@/lib/ai/safety`).
 *
 * The score blends six inputs (per the Phase 21 spec):
 *   1. order context completeness      → orderContextSource
 *   2. customer identification quality → customerIdentified / customerHasOrders
 *   3. merchant grounding availability → groundingSource
 *   4. classification certainty        → classificationConfidence (email only)
 *   5. response quality indicators     → replySource (openai vs template fallback)
 *   6. retrieval completeness          → retrievalComplete
 *
 * Channels without a classifier (chat today) simply omit
 * `classificationConfidence`; the engine falls back to a neutral anchor so it
 * works uniformly across every channel.
 */

export type ConfidenceLevel = "high" | "medium" | "low" | "very_low";

export interface ConfidenceSignals {
  /**
   * Classifier certainty 0-100 when the channel ran classification (email).
   * Omit/undefined for channels without a classifier (chat) — a neutral
   * anchor is used instead.
   */
  classificationConfidence?: number | null;
  /** Where the merchant policy came from: configured workspace value vs. generic default fallback. */
  groundingSource: "workspace" | "default";
  /** Whether the customer/sender was identified (email/handle known). */
  customerIdentified: boolean;
  /** Whether the identified customer has orders on file (undefined = unknown/not applicable). */
  customerHasOrders?: boolean;
  /** Which order/customer context fed generation. */
  orderContextSource: "live" | "stored" | "none";
  /** Whether a real model reply came back ("openai") or the static template fallback fired ("template"). */
  replySource: "openai" | "template";
  /** Retrieval completeness. RAG is not implemented; callers pass whether the grounding surface they needed was present. Defaults to true. */
  retrievalComplete?: boolean;
  /** High-risk category/risk detected (chargeback, legal, fraud, abuse, high-value dispute). */
  highRisk?: boolean;
}

export interface ConfidenceResult {
  /** 0-100 blended confidence score. */
  confidenceScore: number;
  /** Coarse band derived from the score. */
  confidenceLevel: ConfidenceLevel;
  /** Human-readable explanation of the notable factors that moved the score. */
  confidenceReason: string;
}

/** Neutral anchor for channels that do not run a classifier. */
const NEUTRAL_ANCHOR = 60;

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Map a numeric score to a coarse confidence band. */
export function confidenceLevelFor(score: number): ConfidenceLevel {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  if (score >= 25) return "low";
  return "very_low";
}

/**
 * Compute a blended confidence score + level + reason from pipeline signals.
 * Deterministic and side-effect free.
 */
export function scoreConfidence(signals: ConfidenceSignals): ConfidenceResult {
  const reasons: string[] = [];

  // Anchor: the classifier's own certainty when present, otherwise neutral.
  const hasClassifier =
    typeof signals.classificationConfidence === "number" &&
    Number.isFinite(signals.classificationConfidence);
  let score = hasClassifier ? (signals.classificationConfidence as number) : NEUTRAL_ANCHOR;
  if (hasClassifier) {
    reasons.push(`classifier certainty ${Math.round(signals.classificationConfidence as number)}%`);
  }

  // Response quality: a template fallback means the model call failed/was
  // absent — the single strongest negative signal.
  if (signals.replySource === "template") {
    score -= 30;
    reasons.push("template fallback used (model reply unavailable)");
  }

  // Merchant grounding availability.
  if (signals.groundingSource === "workspace") {
    score += 10;
  } else {
    score -= 15;
    reasons.push("no merchant policy configured (generic default grounding)");
  }

  // Customer identification quality.
  if (signals.customerIdentified) {
    score += 5;
    if (signals.customerHasOrders) score += 5;
  } else {
    score -= 5;
    reasons.push("customer not identified");
  }

  // Order context completeness.
  if (signals.orderContextSource === "live") {
    score += 10;
  } else if (signals.orderContextSource === "stored") {
    score += 3;
    reasons.push("order context is from stored data (not live)");
  } else {
    score -= 5;
    reasons.push("no order context available");
  }

  // Retrieval completeness (defaults to complete when not supplied).
  if (signals.retrievalComplete === false) {
    score -= 5;
    reasons.push("grounding/retrieval incomplete");
  }

  // High risk crushes confidence regardless of the other signals.
  if (signals.highRisk) {
    score -= 40;
    reasons.push("high-risk content detected");
  }

  const confidenceScore = clamp(score);
  const confidenceLevel = confidenceLevelFor(confidenceScore);
  const confidenceReason = reasons.length
    ? reasons.join("; ")
    : "all confidence signals nominal";

  return { confidenceScore, confidenceLevel, confidenceReason };
}
