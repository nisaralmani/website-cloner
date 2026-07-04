import { desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversations, messages } from "@/db/schema";
import { formatNotePreview } from "@/lib/inbox/notes";
import { truncatePreview } from "@/lib/inbox/time";

export async function syncConversationPreviewFromLatestMessage(
  db: AppDatabase,
  conversationId: string,
) {
  const lastMessage = await selectOne(
    db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.sortOrder))
      .limit(1),
  );

  if (!lastMessage) {
    await db
      .update(conversations)
      .set({ preview: "—" })
      .where(eq(conversations.id, conversationId));
    return;
  }

  const preview =
    lastMessage.from === "note"
      ? formatNotePreview(lastMessage.text)
      : truncatePreview(lastMessage.text);

  await db
    .update(conversations)
    .set({
      preview,
      timeLabel: lastMessage.timeLabel,
    })
    .where(eq(conversations.id, conversationId));
}
