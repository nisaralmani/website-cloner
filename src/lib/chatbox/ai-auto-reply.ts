import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversationSegments, workspaceSettings } from "@/db/schema";
import { conversationNeedsHuman } from "@/lib/chatbox/human-handoff-state";
import { processAiReply } from "@/lib/ai/orchestrator";
import { runUnifiedAiDecision, messageNeedsOrderContext } from "@/lib/ai/safety-pipeline";
import { getWorkspaceAgentConfig } from "@/lib/email/agent-config";
import { insertInternalSystemNote } from "@/lib/chatbox/widget-thread";
import { SEARCH_AI_ENABLE_TOGGLE_KEY } from "@/lib/chatbox/search-ai-preferences";
import { insertConversationMessage } from "@/lib/inbox/conversation-messages";
import {
  publishConversationUpdated,
  publishMessageCreated,
} from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { toggleSettingKey } from "@/lib/settings/toggles";

async function isSearchAiEnabled(db: AppDatabase, workspaceId: string) {
  const settingKey = toggleSettingKey("chatbox/search-ai", SEARCH_AI_ENABLE_TOGGLE_KEY);
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, settingKey),
        ),
      ),
  );
  return row?.value === "true";
}

async function markNeedsHuman(db: AppDatabase, conversationId: string) {
  await db
    .insert(conversationSegments)
    .values({ conversationId, segment: "needs-human", updatedAt: new Date() })
    .onConflictDoNothing();
}

export async function maybeSendChatAiReply(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  input: {
    customerName?: string | null;
    customerEmail?: string | null;
    /** Latest inbound message text — used only for the model-free order-intent heuristic. */
    messageText?: string | null;
  },
) {
  if (!(await isSearchAiEnabled(db, workspaceId))) {
    return null;
  }

  if (await conversationNeedsHuman(db, conversationId)) {
    return null;
  }

  const reply = await processAiReply({
    db,
    workspaceId,
    conversationId,
    channel: "chat",
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    includeOrderContext: true,
  });

  // Unified safety/confidence gate (Phase 21). Chat has no classifier, so the
  // confidence score is driven by grounding, identity, order context and reply
  // quality; the order-intent heuristic decides whether missing identity/order
  // context should hold the reply back.
  const cfg = await getWorkspaceAgentConfig(db, workspaceId);
  const customerKnown = Boolean(input.customerEmail);
  const orderContextAvailable = reply.orderContextSource !== "none";
  const orderContextRequired = messageNeedsOrderContext(input.messageText);

  const gate = await runUnifiedAiDecision({
    db,
    workspaceId,
    conversationId,
    channel: "chat",
    settings: cfg.safety,
    confidenceSignals: {
      classificationConfidence: undefined, // chat runs no classifier
      groundingSource: reply.grounding.source,
      customerIdentified: customerKnown,
      customerHasOrders: orderContextAvailable,
      orderContextSource: reply.orderContextSource,
      replySource: reply.source,
      highRisk: false,
    },
    safetySignals: {
      groundingConfigured: reply.grounding.source === "workspace",
      customerKnown,
      orderContextAvailable,
      orderContextRequired,
      highRiskCategory: false,
    },
    replySource: reply.source,
    groundingSource: reply.grounding.source,
    orderContextSource: reply.orderContextSource,
    draftText: reply.text,
  });

  const republishConversationList = async () => {
    const conversationList = await fetchWorkspaceConversations(workspaceId);
    publishConversationUpdated(workspaceId, conversationList);
  };

  // Not confident/safe enough to auto-send: hold the reply as a draft note and,
  // for review/block, escalate to a human. Nothing goes to the customer.
  if (gate.decision !== "AUTO_SEND") {
    const explanation = cfg.safety.confidenceExplanation
      ? ` — ${gate.confidence.confidenceReason}`
      : "";
    await insertInternalSystemNote(
      db,
      workspaceId,
      conversationId,
      `AI reply withheld (${gate.decision}, ${gate.confidence.confidenceScore}% confidence)${explanation}\n\nProposed reply:\n${reply.text}`,
    );
    if (gate.decision === "HUMAN_REVIEW" || gate.decision === "BLOCK_REPLY") {
      await markNeedsHuman(db, conversationId);
    }
    await republishConversationList();
    return {
      message: null,
      source: reply.source,
      decision: gate.decision,
      confidence: gate.confidence.confidenceScore,
    };
  }

  const apiMessage = await insertConversationMessage(db, conversationId, "operator", reply.text);
  if (!apiMessage) {
    return null;
  }

  publishMessageCreated(workspaceId, conversationId, [apiMessage]);
  await republishConversationList();

  return {
    message: apiMessage,
    source: reply.source,
    decision: gate.decision,
    confidence: gate.confidence.confidenceScore,
  };
}
