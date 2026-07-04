import type { AppDatabase } from "@/db/client";
import { insertConversationMessage } from "@/lib/inbox/conversation-messages";
import {
  publishConversationUpdated,
  publishMessageCreated,
} from "@/lib/inbox/event-bus";
import type { ApiMessage } from "@/lib/inbox/mappers";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import {
  applySortTriage,
  applySpamTag,
  evaluateBlockTriage,
  type BlockTriageOutcome,
  type SortTriageResult,
} from "@/lib/triage/runtime";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";
import type { Conversation, MessageAttachment } from "@/types/inbox";

export type VisitorIngestTriage = {
  block: {
    ruleId: string;
    ruleName: string;
    action: "Drop Message" | "Send to Spam";
  } | null;
  sort: SortTriageResult | null;
};

export type VisitorIngestResult =
  | {
      dropped: true;
      triage: VisitorIngestTriage;
      message: null;
      conversation: Conversation | null;
    }
  | {
      dropped: false;
      triage: VisitorIngestTriage;
      message: ApiMessage;
      conversation: Conversation | null;
    };

function triagePayload(
  blockOutcome: BlockTriageOutcome,
  sortOutcome: SortTriageResult | null,
): VisitorIngestTriage {
  return {
    block:
      blockOutcome.type === "drop"
        ? {
            ruleId: blockOutcome.ruleId,
            ruleName: blockOutcome.ruleName,
            action: "Drop Message",
          }
        : blockOutcome.type === "spam"
          ? {
              ruleId: blockOutcome.ruleId,
              ruleName: blockOutcome.ruleName,
              action: "Send to Spam",
            }
          : null,
    sort: sortOutcome,
  };
}

export async function ingestVisitorMessage(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  text: string,
  options?: {
    publish?: boolean;
    messageId?: string;
    attachment?: MessageAttachment;
  },
): Promise<VisitorIngestResult> {
  const publish = options?.publish ?? true;
  const triageText = text.trim() || options?.attachment?.name || "";
  const blockOutcome = await evaluateBlockTriage(db, workspaceId, triageText);

  if (blockOutcome.type === "drop") {
    return {
      dropped: true,
      triage: triagePayload(blockOutcome, null),
      message: null,
      conversation: null,
    };
  }

  const displayText =
    text.trim() || (options?.attachment ? `📎 ${options.attachment.name}` : "");

  const apiMessage = await insertConversationMessage(
    db,
    conversationId,
    "visitor",
    displayText,
    {
      messageId: options?.messageId,
      attachment: options?.attachment,
    },
  );
  if (!apiMessage) {
    throw new Error("Failed to save visitor message");
  }

  if (blockOutcome.type === "spam") {
    await applySpamTag(db, conversationId);
  }

  const sortOutcome = await applySortTriage(db, workspaceId, conversationId, triageText);

  if (publish) {
    publishMessageCreated(workspaceId, conversationId, [apiMessage]);
    const conversationList = await fetchWorkspaceConversations(workspaceId);
    publishConversationUpdated(workspaceId, conversationList);
    await deliverWorkspaceWebhooks(db, workspaceId, "message:visitor", {
      conversationId,
      message: apiMessage,
    });
  }

  const conversationList = await fetchWorkspaceConversations(workspaceId);
  const conversation = conversationList.find((item) => item.id === conversationId) ?? null;

  return {
    dropped: false,
    triage: triagePayload(blockOutcome, sortOutcome),
    message: apiMessage,
    conversation,
  };
}
