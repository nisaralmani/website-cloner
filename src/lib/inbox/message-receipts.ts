import { and, eq, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll, selectOne } from "@/db/client";
import { conversations, messages } from "@/db/schema";
import { publishMessageReceiptUpdated } from "@/lib/inbox/event-bus";
import { toApiMessage, type ApiMessage } from "@/lib/inbox/mappers";

export type MessageReceiptStatus = "delivered" | "read";

function publishReceipt(
  workspaceId: string,
  conversationId: string,
  messageId: string,
  patch: { deliveredAt?: Date | null; readAt?: Date | null },
) {
  publishMessageReceiptUpdated(
    workspaceId,
    conversationId,
    messageId,
    patch.deliveredAt?.toISOString() ?? null,
    patch.readAt?.toISOString() ?? null,
  );
}

export async function markVisitorMessagesRead(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
) {
  const now = new Date();
  const unreadVisitorMessages = await selectAll(
    db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.from, "visitor"),
          isNull(messages.readAt),
        ),
      ),
  );

  if (unreadVisitorMessages.length === 0) {
    return [];
  }

  await db
    .update(messages)
    .set({ readAt: now })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.from, "visitor"),
        isNull(messages.readAt),
      ),
    );

  for (const message of unreadVisitorMessages) {
    publishReceipt(workspaceId, conversationId, message.id, {
      deliveredAt: message.deliveredAt,
      readAt: now,
    });
  }

  return unreadVisitorMessages.map((message) => message.id);
}

export async function applyMessageReceipt(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  messageId: string,
  status: MessageReceiptStatus,
  expectedFrom: "visitor" | "operator",
): Promise<ApiMessage | null> {
  const conversation = await selectOne(
    db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.workspaceId, workspaceId))),
  );
  if (!conversation) {
    return null;
  }

  const row = await selectOne(
    db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId))),
  );
  if (!row || row.from !== expectedFrom) {
    return null;
  }

  const now = new Date();
  const patch: { deliveredAt?: Date; readAt?: Date } = {};

  if (status === "delivered" && !row.deliveredAt) {
    patch.deliveredAt = now;
  }

  if (status === "read") {
    if (!row.deliveredAt) {
      patch.deliveredAt = now;
    }
    if (!row.readAt) {
      patch.readAt = now;
    }
  }

  if (Object.keys(patch).length === 0) {
    return toApiMessage(row);
  }

  await db.update(messages).set(patch).where(eq(messages.id, messageId));

  const updated = await selectOne(db.select().from(messages).where(eq(messages.id, messageId)));
  if (!updated) {
    return null;
  }

  publishReceipt(workspaceId, conversationId, messageId, {
    deliveredAt: updated.deliveredAt,
    readAt: updated.readAt,
  });

  return toApiMessage(updated);
}
