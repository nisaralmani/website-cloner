import type { AppDatabase } from "@/db/client";
import type { conversations } from "@/db/schema";
import { toCustomerDetails } from "@/lib/inbox/mappers";
import { fetchSegmentsForConversation } from "@/lib/inbox/conversation-segments";
import { fetchVisitorDataForConversation } from "@/lib/inbox/visitor-data";
import type { CustomerDetails } from "@/types/inbox";

type ConversationRow = typeof conversations.$inferSelect;

export async function buildCustomerDetailsForConversation(
  db: AppDatabase,
  row: ConversationRow,
  conversationId: string,
): Promise<CustomerDetails> {
  const [visitorData, segments] = await Promise.all([
    fetchVisitorDataForConversation(db, conversationId),
    fetchSegmentsForConversation(db, conversationId),
  ]);

  return {
    ...toCustomerDetails(row),
    visitorData,
    segments,
  };
}
