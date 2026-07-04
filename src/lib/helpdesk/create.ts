import { randomUUID } from "crypto";
import { eq, max } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { helpdeskArticles } from "@/db/schema";
import { toHelpdeskArticle } from "@/lib/helpdesk/mappers";
import type { HelpdeskArticleStatus } from "@/types/helpdesk";

const VALID_STATUSES = new Set<HelpdeskArticleStatus>(["draft", "visible", "hidden"]);

export async function createHelpdeskArticle(
  db: AppDatabase,
  workspaceId: string,
  input: {
    title: string;
    status?: HelpdeskArticleStatus;
    categoryId?: string | null;
    body?: string;
  },
) {
  const title = input.title.trim();
  if (!title) {
    return { ok: false as const, error: "title is required" };
  }

  const status = input.status ?? "draft";
  if (!VALID_STATUSES.has(status)) {
    return { ok: false as const, error: "status is invalid" };
  }

  const [maxOrderRow] = await db
    .select({ value: max(helpdeskArticles.sortOrder) })
    .from(helpdeskArticles)
    .where(eq(helpdeskArticles.workspaceId, workspaceId));

  const id = randomUUID();
  const nowLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  await db.insert(helpdeskArticles).values({
    id,
    workspaceId,
    title,
    body: input.body?.trim() ?? "",
    status,
    categoryId: input.categoryId?.trim() || null,
    views: 0,
    helpfulCount: 0,
    lastUpdate: nowLabel,
    sortOrder: (maxOrderRow?.value ?? -1) + 1,
  });

  const row = await selectOne(
    db.select().from(helpdeskArticles).where(eq(helpdeskArticles.id, id)),
  );
  if (!row) {
    return { ok: false as const, error: "Failed to create article" };
  }

  return { ok: true as const, article: toHelpdeskArticle(row) };
}
