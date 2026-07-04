/**
 * Channel-agnostic AI decision interface (A2-T2).
 *
 * The decision algorithm itself lives in `@/lib/email/email-agent`
 * (`analyzeEmail` + `decide`). That module is battle-tested but its PUBLIC
 * input shape is email-specific (`subject` / `body` / `fromEmail`). This module
 * is a thin adapter that exposes ONE channel-neutral interface over the exact
 * same algorithm, so future channels (chat, instagram, whatsapp, facebook) can
 * route through it without inheriting email-shaped field names.
 *
 * IMPORTANT — this is an interface/adapter only:
 *  - It does NOT change the decision algorithm, prompts, or models.
 *  - It does NOT enable the decision engine for chat. Chat still bypasses it.
 *  - Email keeps producing byte-identical decisions: the adapter forwards
 *    `message` → `body`, `senderId` → `fromEmail`, `subject` → `subject`.
 */
import {
  analyzeEmail,
  decide,
  type AnalyzeInput,
  type Decision,
  type DecisionConfig,
  type EmailAnalysis,
  type EnrichedCustomer,
} from "@/lib/email/email-agent";

/** Channels the decision interface is designed to serve. Only `email` is wired today. */
export type AiChannel = "chat" | "email" | "instagram" | "whatsapp" | "facebook";

/** Channel-neutral aliases over the shared (currently email-named) algorithm types. */
export type AiAnalysis = EmailAnalysis;
export type AiDecision = Decision;
export type AiDecisionConfig = DecisionConfig;
export type AiCustomerContext = EnrichedCustomer;

/**
 * Channel-agnostic input to the decision engine. Field names carry no email
 * assumptions: `subject` is optional (DM channels have none), `message` is the
 * inbound text, `senderId` is whatever stable identifier the channel uses.
 */
export interface AiDecisionInput {
  channel: AiChannel;
  /** Latest inbound message text to act on. */
  message: string;
  /** Optional topic/subject line — present for email, usually absent for chat/DM. */
  subject?: string;
  /** Stable sender identifier for the channel (email address, handle, phone number). */
  senderId: string;
  /** Human-readable sender name, if known. */
  senderName?: string;
  /** Enriched customer/order context (channel-agnostic). */
  customer: AiCustomerContext | null;
  /** Prior turns, oldest→newest. */
  history?: { role: "customer" | "agent"; content: string }[];
  /** Owner's decision-mode config (mode, threshold, spam/VIP toggles). */
  config: AiDecisionConfig;
}

/** Channel-agnostic result: the full analysis plus the concrete routing decision. */
export interface AiDecisionResult {
  analysis: AiAnalysis;
  decision: AiDecision;
}

/** Map the channel-neutral input onto the email-agent's existing input shape. */
function toAnalyzeInput(input: AiDecisionInput): AnalyzeInput {
  return {
    subject: input.subject ?? "",
    body: input.message,
    fromEmail: input.senderId,
    fromName: input.senderName,
    customer: input.customer,
    history: input.history,
  };
}

/**
 * Run the shared analyze→decide pipeline through the channel-agnostic
 * interface. Behavior is identical to calling `analyzeEmail` + `decide`
 * directly — this only removes the email-shaped field names from the surface.
 */
export async function runAiDecision(input: AiDecisionInput): Promise<AiDecisionResult> {
  const analysis = await analyzeEmail(toAnalyzeInput(input));
  const decision = decide(analysis, input.config);
  return { analysis, decision };
}
