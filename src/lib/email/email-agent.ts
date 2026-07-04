/**
 * AI Email Agent pipeline (Willdesk / Gorgias style).
 *
 * Turns a single inbound message into a structured decision through six steps:
 *   1. Classification      → one of EMAIL_CATEGORIES
 *   2. Customer identity   → handled by the caller (email/From)
 *   3. Shopify enrichment  → lookupCustomer (LTV, orders, tags)
 *   4. AI analysis         → sentiment, risk, confidence, summary, recommended action
 *   5. Decision engine     → reply / draft / note-only / spam / ignore / escalate
 *   6. Action              → performed by the caller (aiAgent.ts / imap.ts)
 *
 * The heavy lifting (classify + analyse) uses OpenAI when OPENAI_API_KEY is set,
 * and always falls back to deterministic rules so the agent keeps working
 * without a key. Spam and no-reply senders are caught by fast rules BEFORE any
 * model call, so junk never costs a token and never reaches a human.
 */
import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";
import { sanitizePromptField } from "@/lib/security/prompt-sanitizer";

export type EnrichedCustomer = {
  name: string;
  email: string;
  ltv: number;
  ordersCount: number;
  tags: string[];
  orders: Array<{
    number: string;
    status: string;
    placedAt: string;
    items: number;
    total: number;
    currency: string;
  }>;
};

/* ----------------------------------------------------------------------- *
 * Taxonomy
 * ----------------------------------------------------------------------- */

export const EMAIL_CATEGORIES = [
  "order_tracking",
  "shipping_delay",
  "address_change",
  "cancel_order",
  "refund_request",
  "return_request",
  "product_question",
  "inventory_question",
  "complaint",
  "chargeback_risk",
  "vip_customer",
  "general_inquiry",
  "spam",
  "marketing",
  "newsletter",
  "cold_outreach",
  "vendor_pitch",
  "affiliate_request",
  "partnership_request",
  "recruitment",
  "system_notification",
  "no_reply",
  "unknown",
] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

export type Sentiment = "positive" | "neutral" | "frustrated" | "angry";
export type RiskLevel = "low" | "medium" | "high";

/** What the agent should do with this message. */
export type AgentDecision =
  | "auto_reply" // send a reply now (Full Auto, confident, low risk)
  | "draft_reply" // write a draft for an agent to approve
  | "note_only" // internal note only, no customer reply
  | "spam" // junk — no ticket activity, no notification
  | "ignore" // no-reply / system mail — store, do nothing
  | "escalate"; // hand to a human (uncertain or high risk)

/** Categories the AI is allowed to resolve on its own. */
const AUTO_RESOLVABLE: ReadonlySet<EmailCategory> = new Set<EmailCategory>([
  "order_tracking",
  "shipping_delay",
  "address_change",
  "return_request",
  "product_question",
  "inventory_question",
  "general_inquiry",
]);

/** Categories that always require a human, regardless of confidence. */
const ALWAYS_ESCALATE: ReadonlySet<EmailCategory> = new Set<EmailCategory>([
  "chargeback_risk",
  "complaint",
]);

/** Junk categories — filtered as spam (no ticket noise, no human). */
const SPAM_CATEGORIES: ReadonlySet<EmailCategory> = new Set<EmailCategory>([
  "spam",
  "marketing",
  "newsletter",
  "cold_outreach",
  "vendor_pitch",
  "affiliate_request",
  "recruitment",
]);

/* ----------------------------------------------------------------------- *
 * Fast rule-based pre-filters (no model call)
 * ----------------------------------------------------------------------- */

const NO_REPLY_SENDER =
  /(?:^|[._-])(?:no-?reply|do-?not-?reply|donotreply|notification|notifications|mailer-daemon|postmaster|system|bounce|auto(?:mated)?|alerts?|root|cron)(?:[._-]|@)/i;

const SPAM_SIGNALS = [
  /\bguest post\b/i,
  /\bbacklinks?\b/i,
  /\blink building\b/i,
  /\bseo (?:services?|expert|agency|audit)\b/i,
  /\bincrease (?:your )?(?:traffic|ranking|sales)\b/i,
  /\b(?:lead generation|cold email|email list|bulk email)\b/i,
  /\bunsubscribe\b.*\bclick here\b/i,
  /\b(?:crypto|forex|investment opportunity)\b/i,
  /\bwork from home\b/i,
  /\bact now\b.*\blimited (?:time|offer)\b/i,
];

/** True for senders we should never reply to or ticket (no-reply, daemons). */
export function isNoReplySender(email: string): boolean {
  return NO_REPLY_SENDER.test(email);
}

/** Cheap heuristic spam score (0-1) from subject + body keywords. */
function spamHeuristic(subject: string, body: string): number {
  const text = `${subject}\n${body}`;
  let hits = 0;
  for (const re of SPAM_SIGNALS) if (re.test(text)) hits++;
  // 2+ distinct spam signals → very likely junk.
  return Math.min(1, hits / 2);
}

/* ----------------------------------------------------------------------- *
 * VIP detection
 * ----------------------------------------------------------------------- */

const VIP_TAG = /\b(vip|wholesale|priority|gold|platinum)\b/i;

export function isVipCustomer(c: EnrichedCustomer | null): boolean {
  if (!c) return false;
  if ((c.ltv ?? 0) >= 500) return true;
  if ((c.ordersCount ?? 0) >= 5) return true;
  return (c.tags ?? []).some((t) => VIP_TAG.test(t));
}

/* ----------------------------------------------------------------------- *
 * Analysis result
 * ----------------------------------------------------------------------- */

export interface EmailAnalysis {
  category: EmailCategory;
  sentiment: Sentiment;
  risk: RiskLevel;
  confidence: number; // 0-100
  isSpam: boolean;
  isNoReply: boolean;
  isVip: boolean;
  summary: string; // 1-2 sentence rolling summary
  recommendedAction: string; // short agent guidance
  internalNote: string; // formatted block for the timeline
  source: "openai" | "rules";
}

export interface AnalyzeInput {
  subject: string;
  body: string;
  fromEmail: string;
  fromName?: string;
  customer: EnrichedCustomer | null;
  /** prior turns, oldest→newest, for summary context (optional). */
  history?: { role: "customer" | "agent"; content: string }[];
}

/* ----------------------------------------------------------------------- *
 * Step 1+4: classify + analyse
 * ----------------------------------------------------------------------- */

function isAiConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/** Title-case a snake_case category for display. */
export function categoryLabel(c: EmailCategory): string {
  return c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/** Inbox folder for a category. Every email lands in exactly one folder so the
 *  team can separate junk from real customers at a glance. The AI only auto-
 *  replies to "Important" mail (orders/products/etc.); Spam/Promotions/System
 *  are never replied to — they just stay visible with a note. */
export type EmailFolder = "Spam" | "Promotions" | "Important" | "System";
export function emailFolder(category: EmailCategory): EmailFolder {
  if (category === "no_reply" || category === "system_notification") return "System";
  if (category === "marketing" || category === "newsletter") return "Promotions";
  if (SPAM_CATEGORIES.has(category)) return "Spam"; // spam, cold_outreach, vendor_pitch, affiliate_request, recruitment
  return "Important"; // genuine customer mail: orders, products, shipping, returns, complaints, general, vip
}

/** Deterministic classification used as a fallback and to seed the model. */
function ruleClassify(subject: string, body: string): EmailCategory {
  const t = `${subject}\n${body}`.toLowerCase();
  if (/\b(track|where('?s| is)|tracking|delivered|delivery status)\b/.test(t)) return "order_tracking";
  if (/\b(delay|late|haven'?t (received|got)|still waiting|not (here|arrived))\b/.test(t)) return "shipping_delay";
  if (/\b(change|update|wrong) (my )?(shipping )?address\b/.test(t)) return "address_change";
  if (/\bcancel(l(ed|ing)?)?\b.*\border\b|\bcancel my order\b/.test(t)) return "cancel_order";
  if (/\brefund\b/.test(t)) return "refund_request";
  if (/\breturn\b|\bexchange\b/.test(t)) return "return_request";
  if (/\bchargeback|dispute|fraud|unauthori[sz]ed charge\b/.test(t)) return "chargeback_risk";
  if (/\b(in ?stock|out of stock|availability|restock|when.*available)\b/.test(t)) return "inventory_question";
  if (/\b(size|sizing|material|fit|color|colour|how (do|does)|spec)\b/.test(t)) return "product_question";
  if (/\b(angry|terrible|worst|unacceptable|disappointed|complain|scam)\b/.test(t)) return "complaint";
  if (/\bguest post|backlink|seo |link building|partnership\b/.test(t)) return "cold_outreach";
  if (/\bunsubscribe|newsletter|% off|sale ends|promo code\b/.test(t)) return "marketing";
  return "general_inquiry";
}

function ruleSentiment(subject: string, body: string): Sentiment {
  const t = `${subject}\n${body}`.toLowerCase();
  if (/\b(furious|outrageous|disgusting|never again|lawsuit|sue|scam|fraud|worst)\b/.test(t)) return "angry";
  if (/\b(frustrated|disappointed|unhappy|still waiting|unacceptable|again\?|ridiculous)\b/.test(t)) return "frustrated";
  if (/\b(thank|thanks|appreciate|love|great|awesome|happy|excellent)\b/.test(t)) return "positive";
  return "neutral";
}

interface ModelAnalysis {
  category: EmailCategory;
  sentiment: Sentiment;
  risk: RiskLevel;
  confidence: number;
  summary: string;
  recommendedAction: string;
}

async function modelAnalyze(input: AnalyzeInput): Promise<ModelAnalysis | null> {
  if (!isAiConfigured()) return null;
  const { subject, body, customer } = input;
  const custLine = customer
    ? `Customer: ${sanitizePromptField(customer.name)} (${sanitizePromptField(customer.email)}). ` +
      `LTV $${customer.ltv ?? 0}, ${customer.ordersCount ?? 0} orders. ` +
      `Tags: ${(customer.tags ?? []).map((tag) => sanitizePromptField(tag)).join(", ") || "none"}.`
    : "Customer not found in Shopify.";
  const histLine =
    input.history && input.history.length
      ? "\n\nPrior thread:\n" +
        input.history
          .slice(-6)
          .map((h) => `${h.role === "customer" ? "Customer" : "Agent"}: ${h.content}`)
          .join("\n")
      : "";

  try {
    const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      timeout: 9000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You triage inbound customer-support emails for a Shopify store. " +
              "Respond ONLY with a JSON object: {category, sentiment, risk, confidence, summary, recommendedAction}. " +
              `category ∈ [${EMAIL_CATEGORIES.join(", ")}]. ` +
              "sentiment ∈ [positive, neutral, frustrated, angry]. risk ∈ [low, medium, high]. " +
              "confidence is an integer 0-100 = how confident you are this can be answered correctly and automatically from store policy + order data. " +
              "Use high risk for chargebacks, legal/threats, fraud, abuse, or high-value disputes. " +
              "summary = 1-2 sentences describing the request. recommendedAction = short agent guidance. " +
              "Mark obvious marketing/SEO/cold-outreach/recruitment as spam-like categories with low confidence.",
          },
          {
            role: "user",
            content: `${custLine}\n\nSubject: ${subject}\n\nMessage:\n${body}${histLine}`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ModelAnalysis>;
    const category = (EMAIL_CATEGORIES as readonly string[]).includes(parsed.category as string)
      ? (parsed.category as EmailCategory)
      : "unknown";
    const sentiment: Sentiment = (["positive", "neutral", "frustrated", "angry"].includes(parsed.sentiment as string)
      ? parsed.sentiment
      : "neutral") as Sentiment;
    const risk: RiskLevel = (["low", "medium", "high"].includes(parsed.risk as string)
      ? parsed.risk
      : "low") as RiskLevel;
    const confidence = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence ?? 50))));
    return {
      category,
      sentiment,
      risk,
      confidence,
      summary: (parsed.summary || "").trim() || "Customer inquiry.",
      recommendedAction: (parsed.recommendedAction || "").trim() || "Review and respond.",
    };
  } catch {
    return null;
  }
}

/** Build the agent-facing internal note block (spec format). */
function buildInternalNote(a: {
  customer: EnrichedCustomer | null;
  category: EmailCategory;
  sentiment: Sentiment;
  risk: RiskLevel;
  confidence: number;
  recommendedAction: string;
  isVip: boolean;
}): string {
  const c = a.customer;
  const latestOrder = c?.orders?.[0]?.number ?? "—";
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return [
    `Customer: ${c?.name ?? "Unknown"}${a.isVip ? " ⭐ VIP" : ""}`,
    `Customer Value: $${(c?.ltv ?? 0).toLocaleString()}`,
    `Orders: ${c?.ordersCount ?? 0}`,
    `Latest Order: ${latestOrder}`,
    `Issue: ${categoryLabel(a.category)}`,
    `Sentiment: ${cap(a.sentiment)}`,
    `Risk: ${cap(a.risk)}`,
    `Recommended Action: ${a.recommendedAction}`,
    `Confidence: ${a.confidence}%`,
  ].join("\n");
}

/**
 * Run the full analysis pipeline on one inbound message.
 * Pure analysis — does NOT send anything or touch the DB.
 */
export async function analyzeEmail(input: AnalyzeInput): Promise<EmailAnalysis> {
  const { subject, body, fromEmail, customer } = input;

  // Step 0 — fast rule pre-filters before spending a token.
  const noReply = isNoReplySender(fromEmail);
  const heuristic = spamHeuristic(subject, body);

  // Step 1+4 — model (or rule) classification + analysis.
  const model = await modelAnalyze(input);

  let category: EmailCategory = model?.category ?? ruleClassify(subject, body);
  let sentiment: Sentiment = model?.sentiment ?? ruleSentiment(subject, body);
  const risk: RiskLevel = model?.risk ?? (category === "chargeback_risk" ? "high" : "low");
  let confidence = model?.confidence ?? (AUTO_RESOLVABLE.has(category) ? 70 : 40);

  // Reconcile rules with the model: strong heuristic spam overrides a soft guess.
  if (heuristic >= 1 && !SPAM_CATEGORIES.has(category)) {
    category = "spam";
    confidence = Math.min(confidence, 30);
  }
  if (noReply) {
    category = "no_reply";
    sentiment = "neutral";
  }

  const isSpam = SPAM_CATEGORIES.has(category) || heuristic >= 1;
  const isVip = isVipCustomer(customer);

  const summary = model?.summary ?? `${categoryLabel(category)} from ${input.fromName ?? fromEmail}.`;
  const recommendedAction =
    model?.recommendedAction ??
    (AUTO_RESOLVABLE.has(category) ? "Answer from store policy / order data." : "Review and respond personally.");

  const internalNote = buildInternalNote({
    customer,
    category,
    sentiment,
    risk,
    confidence,
    recommendedAction,
    isVip,
  });

  return {
    category,
    sentiment,
    risk,
    confidence,
    isSpam,
    isNoReply: noReply,
    isVip,
    summary,
    recommendedAction,
    internalNote,
    source: model ? "openai" : "rules",
  };
}

/* ----------------------------------------------------------------------- *
 * Step 5: decision engine
 * ----------------------------------------------------------------------- */

export interface DecisionConfig {
  mode: "auto" | "approval" | "notes";
  confidenceThreshold: number; // 0-100
  spamFilter: boolean;
  ignoreNoReply: boolean;
  vipAutoEscalate: boolean;
}

export interface Decision {
  decision: AgentDecision;
  reason: string;
}

/**
 * Map an analysis + the owner's review-mode config to a concrete action.
 * Ordering matters: junk/no-reply and hard-escalate categories win before
 * the confidence/mode logic.
 */
export function decide(a: EmailAnalysis, cfg: DecisionConfig): Decision {
  // No-reply / system senders: never reply, never ticket-noise.
  if (a.isNoReply && cfg.ignoreNoReply) return { decision: "ignore", reason: "no-reply sender" };

  // Spam: drop quietly.
  if (a.isSpam && cfg.spamFilter) return { decision: "spam", reason: "classified as spam/marketing" };

  // Always-human categories (chargebacks, complaints) and explicit high risk.
  if (ALWAYS_ESCALATE.has(a.category) || a.risk === "high")
    return { decision: "escalate", reason: `high-risk (${a.category}/${a.risk})` };

  // Angry customers go to a human even if otherwise resolvable.
  if (a.sentiment === "angry") return { decision: "escalate", reason: "angry customer" };

  // VIPs optionally always get a human.
  if (a.isVip && cfg.vipAutoEscalate) return { decision: "escalate", reason: "VIP customer" };

  // Notes-only mode never drafts or sends.
  if (cfg.mode === "notes") return { decision: "note_only", reason: "notes-only mode" };

  // Below threshold → human, regardless of mode.
  if (a.confidence < cfg.confidenceThreshold)
    return { decision: "escalate", reason: `confidence ${a.confidence}% < ${cfg.confidenceThreshold}%` };

  // Not an auto-resolvable category → human.
  if (!AUTO_RESOLVABLE.has(a.category))
    return { decision: "escalate", reason: `category ${a.category} needs review` };

  // Confident + resolvable: Full Auto sends, Approval drafts.
  return cfg.mode === "auto"
    ? { decision: "auto_reply", reason: `confident (${a.confidence}%) ${a.category}` }
    : { decision: "draft_reply", reason: `confident (${a.confidence}%), approval required` };
}
