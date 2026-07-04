/**
 * AI email/chat auto-responder (ported from Ai Helpdesk aiAgent.ts).
 */
import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversationSegments, conversations, messages } from "@/db/schema";
import { logAiDecision, setConversationAi } from "@/lib/email/ai-agent-log";
import { getWorkspaceAgentConfig } from "@/lib/email/agent-config";
import {
  categoryLabel,
  emailFolder,
  type EmailAnalysis,
} from "@/lib/email/email-agent";
import { mapShopifyToEnrichedCustomer } from "@/lib/email/customer-enrichment";
import { runAiDecision } from "@/lib/ai/decision-engine";
import { processAiReply } from "@/lib/ai/orchestrator";
import { runUnifiedAiDecision } from "@/lib/ai/safety-pipeline";
import { enqueueAiReview } from "@/lib/ai/review-queue";
import { confidenceLevelFor } from "@/lib/ai/confidence";
import { getWorkspaceEmailConfig } from "@/lib/email/workspace-config";
import { sendMailSmtp, isWorkspaceSmtpConfigured } from "@/lib/email/smtp-transport";
import { type ChatTurn } from "@/lib/chatbox/ai-reply";
import { insertConversationMessage } from "@/lib/inbox/conversation-messages";
import {
  publishConversationUpdated,
  publishMessageCreated,
} from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { selectConversationMessages } from "@/lib/inbox/message-queries";
import { selectAll } from "@/db/client";
import { insertInternalSystemNote } from "@/lib/chatbox/widget-thread";
import { resolveOrderContext } from "@/lib/integrations/order-context-resolver";

async function upsertSegment(db: AppDatabase, conversationId: string, segment: string) {
  await db
    .insert(conversationSegments)
    .values({ conversationId, segment, updatedAt: new Date() })
    .onConflictDoNothing();
}

function priorityStatus(analysis: EmailAnalysis): string {
  if (analysis.sentiment === "angry" || analysis.risk === "high") return "pending";
  return "pending";
}

export interface AutoRespondResult {
  acted: "replied" | "drafted" | "noted" | "handed-off" | "spam" | "ignored" | "skipped";
  reason: string;
  decision?: string;
  category?: string;
  confidence?: number;
}

export async function autoRespondToConversation(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  opts: { force?: boolean } = {},
): Promise<AutoRespondResult> {
  const conversation = await selectOne(
    db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId)),
  );
  if (!conversation || conversation.workspaceId !== workspaceId) {
    return { acted: "skipped", reason: "no-conversation" };
  }

  const cfg = await getWorkspaceAgentConfig(db, workspaceId);
  const channelKey =
    conversation.channel?.toLowerCase() === "email"
      ? "email"
      : conversation.channel?.toLowerCase() === "chat"
        ? "chat"
        : "instagram";
  if (!opts.force && !cfg.channels[channelKey as keyof typeof cfg.channels]?.aiAgent) {
    return { acted: "skipped", reason: "ai-agent-disabled-for-channel" };
  }

  const email = (conversation.customerEmail || "").toLowerCase();
  if (!email) return { acted: "skipped", reason: "no-sender" };

  const messageRows = await selectAll(selectConversationMessages(db, conversationId));
  const threadMessages = messageRows.map((row) => row.message);
  const last = threadMessages[threadMessages.length - 1];
  if (!last || last.from !== "visitor") {
    return { acted: "skipped", reason: "last-message-not-visitor" };
  }

  const enriched = mapShopifyToEnrichedCustomer(
    (await resolveOrderContext({ workspaceId, email })).live?.response ?? null,
    email,
    conversation.name,
  );

  const history: ChatTurn[] = threadMessages
    .filter((message) => message.from === "visitor" || message.from === "operator")
    .map((message) => ({
      role: message.from === "visitor" ? ("user" as const) : ("assistant" as const),
      content: message.text,
    }));

  const { analysis, decision: decisionResult } = await runAiDecision({
    channel: "email",
    subject: conversation.name,
    message: last.text,
    senderId: email,
    senderName: conversation.name,
    customer: enriched,
    history: history.map((entry) => ({
      role: entry.role === "user" ? ("customer" as const) : ("agent" as const),
      content: entry.content,
    })),
    config: cfg.emailAgent,
  });
  const { decision, reason } = decisionResult;

  const audit = (extra: { reason?: string } = {}) =>
    logAiDecision(db, {
      workspaceId,
      conversationId,
      messageId: last.id,
      category: analysis.category,
      sentiment: analysis.sentiment,
      risk: analysis.risk,
      isSpam: analysis.isSpam,
      isVip: analysis.isVip,
      confidence: analysis.confidence,
      decision,
      reason: extra.reason ?? reason,
      model: analysis.source,
      summary: analysis.summary,
    });

  const markConversation = async (segment: string, unread = true) => {
    await db
      .update(conversations)
      .set({
        status: priorityStatus(analysis),
        unread: unread ? conversation.unread + 1 : conversation.unread,
      })
      .where(eq(conversations.id, conversationId));
    await upsertSegment(db, conversationId, segment);
    const conversationList = await fetchWorkspaceConversations(workspaceId);
    publishConversationUpdated(workspaceId, conversationList);
  };

  if (decision === "ignore") {
    await setConversationAi(db, conversationId, {
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      category: analysis.category,
      confidence: analysis.confidence,
      isVip: analysis.isVip,
    });
    await insertInternalSystemNote(db, workspaceId, conversationId, `AI Note — triage\n${analysis.internalNote}`);
    await insertInternalSystemNote(
      db,
      workspaceId,
      conversationId,
      `AI did not reply — automated/no-reply sender (${categoryLabel(analysis.category)}).`,
    );
    await markConversation("system");
    await audit();
    return { acted: "ignored", reason, decision, category: analysis.category };
  }

  if (decision === "spam") {
    const folder = emailFolder(analysis.category);
    await setConversationAi(db, conversationId, {
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      category: analysis.category,
      confidence: analysis.confidence,
      isVip: analysis.isVip,
    });
    await insertInternalSystemNote(db, workspaceId, conversationId, `AI Note — triage\n${analysis.internalNote}`);
    await insertInternalSystemNote(
      db,
      workspaceId,
      conversationId,
      `AI did not reply — classified as ${categoryLabel(analysis.category)} (${folder}).`,
    );
    await markConversation(folder.toLowerCase());
    await audit();
    return { acted: "spam", reason, decision, category: analysis.category };
  }

  await setConversationAi(db, conversationId, {
    summary: analysis.summary,
    sentiment: analysis.sentiment,
    category: analysis.category,
    confidence: analysis.confidence,
    isVip: analysis.isVip,
  });
  await insertInternalSystemNote(db, workspaceId, conversationId, `AI Note — triage\n${analysis.internalNote}`);

  if (decision === "escalate") {
    await insertInternalSystemNote(
      db,
      workspaceId,
      conversationId,
      `AI did not auto-reply — needs a human (${categoryLabel(analysis.category)}).`,
    );
    await markConversation("needs-human");
    await enqueueAiReview(db, {
      workspaceId,
      conversationId,
      messageId: last.id,
      channel: channelKey,
      state: "pending_review",
      decision: "HUMAN_REVIEW",
      reason,
      confidence: analysis.confidence,
      confidenceLevel: confidenceLevelFor(analysis.confidence),
    });
    await audit();
    return {
      acted: "handed-off",
      reason,
      decision,
      category: analysis.category,
      confidence: analysis.confidence,
    };
  }

  const isEmailChannel = conversation.channel?.toLowerCase() === "email";
  const emailConfig = isEmailChannel ? await getWorkspaceEmailConfig(db, workspaceId) : null;
  const reply = await processAiReply({
    db,
    workspaceId,
    conversationId,
    channel: isEmailChannel ? "email" : "chat",
    decision,
    customerName: enriched?.name ?? conversation.name,
    customerEmail: email,
    history,
    email: emailConfig
      ? {
          agentName: cfg.identity.name || "Support",
          storeName: emailConfig.smtp.fromName || "Support",
          website: emailConfig.smtp.fromEmail?.includes("@")
            ? emailConfig.smtp.fromEmail.split("@")[1]
            : undefined,
        }
      : undefined,
  });

  if (decision === "note_only") {
    await insertInternalSystemNote(
      db,
      workspaceId,
      conversationId,
      `AI Suggested reply (notes-only — not sent):\n\n${reply.text}`,
    );
    await markConversation("important");
    await audit();
    return { acted: "noted", reason, decision, category: analysis.category, confidence: analysis.confidence };
  }

  if (decision === "draft_reply") {
    await insertInternalSystemNote(
      db,
      workspaceId,
      conversationId,
      `AI Draft — pending approval (${analysis.confidence}%):\n\n${reply.text}`,
    );
    await markConversation("important");
    await enqueueAiReview(db, {
      workspaceId,
      conversationId,
      messageId: last.id,
      channel: channelKey,
      state: "draft_created",
      decision: "CREATE_DRAFT",
      reason,
      confidence: analysis.confidence,
      confidenceLevel: confidenceLevelFor(analysis.confidence),
      draftText: reply.text,
    });
    await audit();
    return { acted: "drafted", reason, decision, category: analysis.category, confidence: analysis.confidence };
  }

  // Unified safety gate (Phase 21) — the existing decision engine already
  // approved this auto_reply; safety can only tighten it. Missing grounding,
  // an unknown customer on an order-request, high risk, a sub-threshold
  // confidence, or a merchant switch converts the send into a held draft/handoff.
  const ORDER_CATEGORIES = new Set([
    "order_tracking",
    "shipping_delay",
    "address_change",
    "cancel_order",
    "refund_request",
    "return_request",
  ]);
  const gate = await runUnifiedAiDecision({
    db,
    workspaceId,
    conversationId,
    channel: channelKey,
    settings: cfg.safety,
    confidenceSignals: {
      classificationConfidence: analysis.confidence,
      groundingSource: reply.grounding.source,
      customerIdentified: Boolean(email),
      customerHasOrders: (enriched?.orders?.length ?? 0) > 0,
      orderContextSource: enriched ? "live" : "none",
      replySource: reply.source,
      highRisk: analysis.risk === "high",
    },
    safetySignals: {
      groundingConfigured: reply.grounding.source === "workspace",
      customerKnown: Boolean(email),
      orderContextAvailable: Boolean(enriched),
      orderContextRequired: ORDER_CATEGORIES.has(analysis.category),
      highRiskCategory: analysis.risk === "high",
    },
    messageId: last.id,
    replySource: reply.source,
    groundingSource: reply.grounding.source,
    orderContextSource: enriched ? "live" : "none",
    draftText: reply.text,
  });

  if (gate.decision !== "AUTO_SEND") {
    const explanation = cfg.safety.confidenceExplanation
      ? ` — ${gate.confidence.confidenceReason}`
      : "";
    await insertInternalSystemNote(
      db,
      workspaceId,
      conversationId,
      `AI auto-reply withheld by safety gate (${gate.decision}, ${gate.confidence.confidenceScore}%${explanation}):\n\n${reply.text}`,
    );
    const gatedToDraft = gate.decision === "CREATE_DRAFT";
    await markConversation(gatedToDraft ? "important" : "needs-human");
    await audit({ reason: `${reason}; safety=${gate.decision}` });
    return {
      acted: gatedToDraft ? "drafted" : "handed-off",
      reason: `safety:${gate.decision}`,
      decision,
      category: analysis.category,
      confidence: analysis.confidence,
    };
  }

  const apiMessage = await insertConversationMessage(db, conversationId, "operator", reply.text);
  if (apiMessage) {
    publishMessageCreated(workspaceId, conversationId, [apiMessage]);
  }

  let delivery = "not-email";
  if (isEmailChannel) {
    const subject = conversation.name.startsWith("Re:") ? conversation.name : `Re: ${conversation.name}`;
    const priorIds = threadMessages
      .map((message) => message.rfcMessageId)
      .filter(Boolean) as string[];
    if (await isWorkspaceSmtpConfigured(workspaceId)) {
      const res = await sendMailSmtp(workspaceId, {
        to: email,
        subject,
        text: reply.text,
        inReplyTo: last.rfcMessageId ?? undefined,
        references: priorIds,
      });
      delivery = res.sent ? "emailed-smtp" : `smtp-failed:${res.reason ?? ""}`;
    } else {
      delivery = "email-not-configured";
    }
  }

  await insertInternalSystemNote(
    db,
    workspaceId,
    conversationId,
    `AI auto-replied (${analysis.confidence}% confident). (${delivery})`,
  );
  await markConversation("ai-replied", true);
  await audit({ reason: `${reason}; delivery=${delivery}` });

  return {
    acted: "replied",
    reason: delivery,
    decision,
    category: analysis.category,
    confidence: analysis.confidence,
  };
}
