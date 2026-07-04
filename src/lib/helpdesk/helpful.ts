import { eq, sql } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { helpdeskArticles } from "@/db/schema";
import { toHelpdeskArticle } from "@/lib/helpdesk/mappers";

export async function incrementHelpdeskHelpfulCount(
  db: AppDatabase,
  workspaceId: string,
  articleId: string,
) {
  const existing = await selectOne(
    db.select().from(helpdeskArticles).where(eq(helpdeskArticles.id, articleId)),
  );

  if (!existing || existing.workspaceId !== workspaceId || existing.status !== "visible") {
    return { ok: false as const, reason: "not_found" as const };
  }

  await db
    .update(helpdeskArticles)
    .set({ helpfulCount: sql`${helpdeskArticles.helpfulCount} + 1` })
    .where(eq(helpdeskArticles.id, articleId));

  const row = await selectOne(
    db.select().from(helpdeskArticles).where(eq(helpdeskArticles.id, articleId)),
  );
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, article: toHelpdeskArticle(row) };
}
