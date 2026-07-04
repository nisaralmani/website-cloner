import { randomUUID } from "crypto";
import { and, eq, max } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversations, messages } from "@/db/schema";
import { toApiMessage, type ApiMessage } from "@/lib/inbox/mappers";
import {
  formatConversationTime,
  formatMessageTime,
  truncatePreview,
} from "@/lib/inbox/time";
import { syncConversationPreviewFromLatestMessage } from "@/lib/inbox/conversation-preview";
import type { Message, MessageAttachment } from "@/types/inbox";

type MessageSender = Message["from"];

type InsertMessageOptions = {
  messageId?: string;
  attachment?: MessageAttachment;
};

export async function insertConversationMessage(
  db: AppDatabase,
  conversationId: string,
  from: MessageSender,
  text: string,
  options: InsertMessageOptions = {},
): Promise<ApiMessage | null> {
  const conversation = await selectOne(
    db.select().from(conversations).where(eq(conversations.id, conversationId)),
  );

  if (!conversation) {
    return null;
  }

  const [maxOrderRow] = await db
    .select({ value: max(messages.sortOrder) })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  const now = new Date();
  const messageId = options.messageId ?? randomUUID();
  const sortOrder = (maxOrderRow?.value ?? -1) + 1;
  const timeLabel = formatMessageTime(now);
  const attachment = options.attachment;

  await db.insert(messages).values({
    id: messageId,
    conversationId,
    from,
    text,
    timeLabel,
    sortOrder,
    ...(from === "visitor" ? { deliveredAt: now } : {}),
    ...(attachment
      ? {
          attachmentUrl: attachment.url,
          attachmentName: attachment.name,
          attachmentMime: attachment.mime,
          attachmentSize: attachment.size,
        }
      : {}),
  });

  const previewSource = attachment ? `📎 ${attachment.name}` : text;
  const conversationUpdate =
    from === "visitor"
      ? {
          preview: truncatePreview(previewSource),
          timeLabel: formatConversationTime(now),
          unread: conversation.unread + 1,
          status: conversation.status === "resolved" ? "pending" : conversation.status,
        }
      : {
          preview: truncatePreview(previewSource),
          timeLabel: formatConversationTime(now),
          unread: 0,
        };

  await db.update(conversations).set(conversationUpdate).where(eq(conversations.id, conversationId));

  const row = await selectOne(db.select().from(messages).where(eq(messages.id, messageId)));
  return row ? toApiMessage(row) : null;
}

export type UpdateOperatorMessageResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_operator" | "empty_text" | "has_attachment" };

export async function updateOperatorMessage(
  db: AppDatabase,
  conversationId: string,
  messageId: string,
  text: string,
): Promise<UpdateOperatorMessageResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty_text" };
  }

  const row = await selectOne(
    db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId))),
  );

  if (!row) {
    return { ok: false, reason: "not_found" };
  }

  if (row.from !== "operator") {
    return { ok: false, reason: "not_operator" };
  }

  if (row.attachmentUrl) {
    return { ok: false, reason: "has_attachment" };
  }

  await db.update(messages).set({ text: trimmed }).where(eq(messages.id, messageId));
  await syncConversationPreviewFromLatestMessage(db, conversationId);

  return { ok: true };
}
