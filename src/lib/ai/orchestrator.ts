/**
 * Shared AI reply orchestrator (A2-T1).
 *
 * Centralizes the request-preparation + generation steps that were
 * duplicated between the chat pipeline (`ai-auto-reply.ts`) and the
 * email/Instagram pipeline (`ai-auto-responder.ts`): merchant grounding,
 * conversation history loading, order context resolution, and dispatch to
 * the correct generation function.
 *
 * This does NOT implement classification, confidence scoring, or decision
 * gating — that logic stays exactly where it already lives in each pipeline.
 * `processAiReply` only produces reply text; callers remain responsible for
 * their own gating, delivery, and audit logging, unchanged.
 */
import { selectAll } from "@/db/client";
import type { AppDatabase } from "@/db/client";
import { recordAiAudit } from "@/lib/ai/audit-log";
import { resolveMerchantGrounding, type MerchantGrounding } from "@/lib/ai/merchant-grounding";
import { patchRequestContext } from "@/lib/logging/request-context";
import {
  resolveOrderContext,
  type OrderContextSource,
} from "@/lib/integrations/order-context-resolver";
import { generateChatAiReply, generateEmailAiReply, type ChatTurn } from "@/lib/chatbox/ai-reply";
import { selectConversationMessages } from "@/lib/inbox/message-queries";
import type { ShopifyCustomerSummary } from "@/types/shopify";

export type AiReplyChannel = "chat" | "email";

export interface AiReplyRequest {
  db: AppDatabase;
  workspaceId: string;
  conversationId: string;
  channel: AiReplyChannel;
  customerName?: string | null;
  customerEmail?: string | null;
  /** Pre-computed history (callers that already loaded it for classification). When omitted, the orchestrator loads it. */
  history?: ChatTurn[];
  /** Resolve live Shopify order context and pass it to the chat generator — mirrors the chat pipeline's existing behavior. Defaults to false to preserve the email/Instagram pipeline's current behavior of not passing order context into generation. */
  includeOrderContext?: boolean;
  /** Routing decision that led to this generation, for the audit log. Chat has no gating decision today; defaults to "chat_auto_send". */
  decision?: string;
  /** Email generation details for channel === "email". Optional: falls back to "Support" defaults when absent. */
  email?: {
    agentName: string;
    storeName: string;
    website?: string;
  };
}

export interface AiReplyResult {
  text: string;
  source: "openai" | "template";
  grounding: MerchantGrounding;
  /** Which order/customer context fed generation: "live" | "stored" | "none". Enables callers to score confidence + gate safety without re-resolving. */
  orderContextSource: OrderContextSource;
}

function toChatHistory(rows: { message: { from: string; text: string } }[]): ChatTurn[] {
  return rows
    .filter(({ message }) => message.from === "visitor" || message.from === "operator")
    .map(({ message }) => ({
      role: message.from === "visitor" ? ("user" as const) : ("assistant" as const),
      content: message.text,
    }));
}

async function loadHistory(db: AppDatabase, conversationId: string): Promise<ChatTurn[]> {
  const rows = await selectAll(selectConversationMessages(db, conversationId));
  return toChatHistory(rows);
}

/**
 * Runs the shared request-preparation + generation steps for an AI reply.
 * Both pipelines call this instead of hand-rolling grounding/history/context
 * resolution and generator dispatch themselves.
 */
export async function processAiReply(req: AiReplyRequest): Promise<AiReplyResult> {
  patchRequestContext({
    workspaceId: req.workspaceId,
    conversationId: req.conversationId,
    channel: req.channel,
  });
  const startedAt = Date.now();
  const provider = "openai";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  let groundingSource = "default";
  let orderContextSource: OrderContextSource = "none";

  // Single audit emission point shared by both channels and the failure path.
  const emit = (outcome: { source?: "openai" | "template"; success: boolean; error?: string }) =>
    recordAiAudit({
      workspaceId: req.workspaceId,
      conversationId: req.conversationId,
      channel: req.channel,
      decision: req.decision ?? (req.channel === "chat" ? "chat_auto_send" : "unknown"),
      provider,
      model,
      source: outcome.source ?? "template",
      groundingSource,
      orderContextSource,
      latencyMs: Date.now() - startedAt,
      success: outcome.success,
      error: outcome.error ?? null,
      phase: "generation",
    });

  try {
    const grounding = await resolveMerchantGrounding(req.db, req.workspaceId);
    groundingSource = grounding.source;
    const history = req.history ?? (await loadHistory(req.db, req.conversationId));

    let reply: { text: string; source: "openai" | "template" };
    if (req.channel === "email") {
      // Missing email details must NOT throw: pre-orchestrator, the email
      // generator always ran with "Support" defaults when config was absent.
      // Restore that fallback rather than aborting the reply.
      reply = await generateEmailAiReply({
        history,
        customerName: req.customerName,
        customerEmail: req.customerEmail,
        agentName: req.email?.agentName || "Support",
        storeName: req.email?.storeName || "Support",
        website: req.email?.website,
        storePolicy: grounding.storePolicy,
      });
    } else {
      let shopifyCustomer: ShopifyCustomerSummary | null = null;
      if (req.includeOrderContext) {
        const ctx = await resolveOrderContext({
          workspaceId: req.workspaceId,
          email: req.customerEmail,
        });
        orderContextSource = ctx.source;
        shopifyCustomer = ctx.live?.customer ?? null;
      }

      reply = await generateChatAiReply({
        history,
        customerName: req.customerName,
        customerEmail: req.customerEmail,
        shopifyCustomer,
        storePolicy: grounding.storePolicy,
      });
    }

    emit({ source: reply.source, success: true });
    return { ...reply, grounding, orderContextSource };
  } catch (err) {
    emit({ success: false, error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}
