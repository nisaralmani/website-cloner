import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversationRatings } from "@/db/schema";

export async function recordConversationRating(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  sessionId: string,
  score: number,
  comment?: string,
) {
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    return { ok: false as const, error: "score must be between 1 and 5" };
  }

  const rounded = Math.round(score);
  const existing = await selectOne(
    db
      .select()
      .from(conversationRatings)
      .where(eq(conversationRatings.conversationId, conversationId)),
  );

  const now = new Date();
  if (existing) {
    await db
      .update(conversationRatings)
      .set({ score: rounded, sessionId, comment: comment?.trim() || null, createdAt: now })
      .where(eq(conversationRatings.conversationId, conversationId));
  } else {
    await db.insert(conversationRatings).values({
      id: randomUUID(),
      workspaceId,
      conversationId,
      sessionId,
      score: rounded,
      comment: comment?.trim() || null,
      createdAt: now,
    });
  }

  return { ok: true as const, score: rounded };
}

export async function averageWorkspaceRating(db: AppDatabase, workspaceId: string) {
  const rows = await db
    .select({ score: conversationRatings.score })
    .from(conversationRatings)
    .where(eq(conversationRatings.workspaceId, workspaceId));

  if (rows.length === 0) return 0;
  const total = rows.reduce((sum, row) => sum + row.score, 0);
  return Math.round((total / rows.length) * 10) / 10;
}
