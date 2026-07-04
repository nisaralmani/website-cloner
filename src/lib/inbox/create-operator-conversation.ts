import { randomUUID } from "crypto";
import { max } from "drizzle-orm";
import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { conversations } from "@/db/schema";
import { pickVisitorGradient } from "@/lib/chatbox/visitor-session";
import { toConversationWithAssignee } from "@/lib/inbox/mappers";
import { formatConversationTime } from "@/lib/inbox/time";

export async function createOperatorConversation(
  db: AppDatabase,
  workspaceId: string,
  input: { name?: string } = {},
) {
  const conversationId = randomUUID();
  const now = new Date();
  const name = input.name?.trim() || `Visitor ${now.getTime() % 10000}`;

  const [maxOrderRow] = await db
    .select({ value: max(conversations.sortOrder) })
    .from(conversations)
    .where(eq(conversations.workspaceId, workspaceId));

  await db.insert(conversations).values({
    id: conversationId,
    workspaceId,
    name,
    initials: null,
    preview: "New conversation",
    timeLabel: formatConversationTime(now),
    unread: 0,
    status: "unassigned",
    country: "US",
    avatarGradient: pickVisitorGradient(conversationId),
    sortOrder: (maxOrderRow?.value ?? -1) + 1,
    channel: "manual",
  });

  const [row] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!row) {
    throw new Error("Failed to create conversation");
  }

  return toConversationWithAssignee(row, null, []);
}
