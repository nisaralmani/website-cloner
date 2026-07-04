import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { conversationRatings, conversations } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const rows = await selectAll(
    db
      .select({
        id: conversationRatings.id,
        score: conversationRatings.score,
        createdAt: conversationRatings.createdAt,
        conversationId: conversationRatings.conversationId,
        conversationName: conversations.name,
      })
      .from(conversationRatings)
      .innerJoin(conversations, eq(conversationRatings.conversationId, conversations.id))
      .where(eq(conversationRatings.workspaceId, session.workspace.id))
      .orderBy(desc(conversationRatings.createdAt))
      .limit(20),
  );

  return NextResponse.json({
    ratings: rows.map((row) => ({
      id: row.id,
      score: row.score,
      conversationId: row.conversationId,
      conversationName: row.conversationName,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}
