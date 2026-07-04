import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversationSegments } from "@/db/schema";

export async function conversationNeedsHuman(
  db: AppDatabase,
  conversationId: string,
): Promise<boolean> {
  const row = await selectOne(
    db
      .select({ segment: conversationSegments.segment })
      .from(conversationSegments)
      .where(
        and(
          eq(conversationSegments.conversationId, conversationId),
          eq(conversationSegments.segment, "needs-human"),
        ),
      ),
  );
  return Boolean(row);
}
