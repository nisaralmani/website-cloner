/**
 * AI safety decision engine — thresholds + safety gating (Phase 21, Tasks 2 & 7).
 *
 * This is the ONE place that turns a confidence score + safety signals + the
 * merchant's per-workspace settings into a single, auditable routing decision:
 *
 *     AUTO_SEND | CREATE_DRAFT | HUMAN_REVIEW | BLOCK_REPLY
 *
 * It is a PURE, synchronous function — no DB, no network, no model, no prompt.
 * Both the chat pipeline and the email/Instagram pipeline call `evaluateSafety`
 * so the safety posture is identical across channels (Task 3 — unified pipeline).
 *
 * Design rule: the confidence thresholds pick a BASE tier; the safety gates can
 * only ever DOWNGRADE toward a safer tier, never upgrade. This makes the layer
 * strictly additive over each channel's existing behavior — it can make a reply
 * safer, never riskier.
 */

/** Terminal safety decision for a generated reply. */
export type SafetyDecision = "AUTO_SEND" | "CREATE_DRAFT" | "HUMAN_REVIEW" | "BLOCK_REPLY";

/** Per-workspace score bands that map a confidence score to a base tier. */
export interface ConfidenceThresholds {
  /** Score ≥ this → eligible for AUTO_SEND. */
  autoSend: number;
  /** Score ≥ this (and < autoSend) → CREATE_DRAFT. */
  createDraft: number;
  /** Score ≥ this (and < createDraft) → HUMAN_REVIEW; below → BLOCK_REPLY. */
  humanReview: number;
}

/** Safe default thresholds used when a workspace has not configured its own. */
export const DEFAULT_THRESHOLDS: ConfidenceThresholds = {
  autoSend: 75,
  createDraft: 50,
  humanReview: 25,
};

/**
 * Merchant safety settings (a structural subset of the workspace agent config's
 * `safety` block — no import needed, TypeScript matches it structurally).
 */
export interface SafetySettings {
  /** Master switch: when false, the AI never auto-sends (drafts at most). */
  autoSendEnabled: boolean;
  /** Force every reply to a draft regardless of confidence. */
  draftOnlyMode: boolean;
  /** Force every reply through human review before it can go out. */
  humanReviewRequired: boolean;
  /** Hard confidence floor for AUTO_SEND, independent of the threshold band. */
  minConfidence: number;
  /** Whether to surface the confidence explanation downstream (used by callers/UI). */
  confidenceExplanation: boolean;
  /** Configurable score→tier bands. */
  thresholds: ConfidenceThresholds;
}

/** Safe defaults for a workspace that has not configured safety settings. */
export const DEFAULT_SAFETY_SETTINGS: SafetySettings = {
  autoSendEnabled: true,
  draftOnlyMode: false,
  humanReviewRequired: false,
  minConfidence: 75,
  confidenceExplanation: true,
  thresholds: DEFAULT_THRESHOLDS,
};

/**
 * Hard safety signals (Task 7). Each of these, when it applies, prevents
 * AUTO_SEND and forces at least a draft or review.
 */
export interface SafetySignals {
  /** False when the reply used the generic default policy instead of a configured merchant policy. */
  groundingConfigured: boolean;
  /** Whether the customer/sender is identified. */
  customerKnown: boolean;
  /** Whether order/customer context was available to the generator. */
  orderContextAvailable: boolean;
  /**
   * Whether this message actually needs order context to be answered safely
   * (e.g. "where is my order", refund, cancel). General/policy questions do
   * not, so anonymous shoppers asking those are not blocked. Callers compute
   * this cheaply (category or keyword heuristic) — no model call.
   */
  orderContextRequired: boolean;
  /** High-risk category/risk detected (chargeback, legal, fraud, abuse, high-value dispute). */
  highRiskCategory: boolean;
}

export interface SafetyEvaluationInput {
  confidenceScore: number;
  settings: SafetySettings;
  signals: SafetySignals;
}

export interface SafetyEvaluationResult {
  decision: SafetyDecision;
  /** Ordered list of the gates/reasons that shaped the decision (most safety-relevant first). */
  reasons: string[];
  /** True when a hard safety gate downgraded the decision below its confidence-band tier. */
  gated: boolean;
}

/** Autonomy ranking so we can always take the SAFER (lower) of two tiers. */
const RANK: Record<SafetyDecision, number> = {
  AUTO_SEND: 3,
  CREATE_DRAFT: 2,
  HUMAN_REVIEW: 1,
  BLOCK_REPLY: 0,
};
const BY_RANK: SafetyDecision[] = ["BLOCK_REPLY", "HUMAN_REVIEW", "CREATE_DRAFT", "AUTO_SEND"];

function safer(a: SafetyDecision, b: SafetyDecision): SafetyDecision {
  return BY_RANK[Math.min(RANK[a], RANK[b])];
}

/** Base tier purely from the confidence score and the workspace thresholds. */
export function tierForScore(score: number, t: ConfidenceThresholds): SafetyDecision {
  if (score >= t.autoSend) return "AUTO_SEND";
  if (score >= t.createDraft) return "CREATE_DRAFT";
  if (score >= t.humanReview) return "HUMAN_REVIEW";
  return "BLOCK_REPLY";
}

/**
 * Evaluate the final safety decision. Thresholds choose the base tier; the
 * safety gates below can only cap it to something safer.
 */
export function evaluateSafety(input: SafetyEvaluationInput): SafetyEvaluationResult {
  const { confidenceScore, settings, signals } = input;
  const reasons: string[] = [];

  let decision = tierForScore(confidenceScore, settings.thresholds);
  const baseTier = decision;

  const cap = (to: SafetyDecision, reason: string) => {
    if (RANK[to] < RANK[decision]) {
      decision = safer(decision, to);
      reasons.push(reason);
    }
  };

  // --- Hard safety gates (Task 7). Ordered most-severe first. ---

  // High-risk content always requires a human.
  if (signals.highRiskCategory) {
    cap("HUMAN_REVIEW", "high-risk category detected — human review required");
  }

  // Merchant switches.
  if (settings.humanReviewRequired) {
    cap("HUMAN_REVIEW", "workspace requires human review for every reply");
  }
  if (!settings.autoSendEnabled) {
    cap("CREATE_DRAFT", "auto-send disabled for workspace");
  }
  if (settings.draftOnlyMode) {
    cap("CREATE_DRAFT", "draft-only mode enabled for workspace");
  }

  // Confidence floor for auto-send.
  if (confidenceScore < settings.minConfidence) {
    cap("CREATE_DRAFT", `confidence ${confidenceScore}% below minimum ${settings.minConfidence}%`);
  }

  // Grounding must exist before the AI states policy as fact and auto-sends.
  if (!signals.groundingConfigured) {
    cap("CREATE_DRAFT", "merchant grounding missing — cannot auto-send policy claims");
  }

  // Order-dependent questions need identity + context before auto-sending.
  if (signals.orderContextRequired && !signals.customerKnown) {
    cap("CREATE_DRAFT", "customer unknown for an order-related request");
  }
  if (signals.orderContextRequired && !signals.orderContextAvailable) {
    cap("CREATE_DRAFT", "order context unavailable for an order-related request");
  }

  return { decision, reasons, gated: RANK[decision] < RANK[baseTier] };
}
