import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { helpdeskArticles } from "@/db/schema";
import { toHelpdeskArticle } from "@/lib/helpdesk/mappers";
import type { HelpdeskArticleStatus } from "@/types/helpdesk";

const VALID_STATUSES = new Set<HelpdeskArticleStatus>(["draft", "visible", "hidden"]);

export async function updateHelpdeskArticle(
  db: AppDatabase,
  workspaceId: string,
  articleId: string,
  input: {
    title?: string;
    status?: HelpdeskArticleStatus;
    categoryId?: string | null;
    body?: string;
  },
) {
  const existing = await selectOne(
    db.select().from(helpdeskArticles).where(eq(helpdeskArticles.id, articleId)),
  );

  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const updates: {
    title?: string;
    status?: string;
    categoryId?: string | null;
    body?: string;
    lastUpdate: string;
  } = {
    lastUpdate: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date()),
  };

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      return { ok: false as const, error: "title is required" };
    }
    updates.title = title;
  }

  if (input.status !== undefined) {
    if (!VALID_STATUSES.has(input.status)) {
      return { ok: false as const, error: "status is invalid" };
    }
    updates.status = input.status;
  }

  if (input.categoryId !== undefined) {
    updates.categoryId = input.categoryId?.trim() || null;
  }

  if (input.body !== undefined) {
    updates.body = input.body;
  }

  await db.update(helpdeskArticles).set(updates).where(eq(helpdeskArticles.id, articleId));

  const row = await selectOne(
    db.select().from(helpdeskArticles).where(eq(helpdeskArticles.id, articleId)),
  );
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, article: toHelpdeskArticle(row) };
}

export async function deleteHelpdeskArticle(
  db: AppDatabase,
  workspaceId: string,
  articleId: string,
) {
  const existing = await selectOne(
    db
      .select({ id: helpdeskArticles.id, workspaceId: helpdeskArticles.workspaceId })
      .from(helpdeskArticles)
      .where(eq(helpdeskArticles.id, articleId)),
  );

  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await db.delete(helpdeskArticles).where(eq(helpdeskArticles.id, articleId));
  return { ok: true as const, id: articleId };
}
