import type {
  HelpdeskArticle,
  HelpdeskArticleStatus,
  HelpdeskCategory,
} from "@/types/helpdesk";
import type { helpdeskArticles, helpdeskCategories } from "@/db/schema";

type ArticleRow = typeof helpdeskArticles.$inferSelect;
type CategoryRow = typeof helpdeskCategories.$inferSelect;

export function toHelpdeskArticle(row: ArticleRow): HelpdeskArticle {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? "",
    status: row.status as HelpdeskArticleStatus,
    views: row.views,
    helpfulCount: row.helpfulCount,
    lastUpdate: row.lastUpdate,
    categoryId: row.categoryId ?? undefined,
  };
}

export function toHelpdeskCategory(
  row: CategoryRow,
  articleCount: number,
): HelpdeskCategory {
  return {
    id: row.id,
    name: row.name,
    articleCount,
  };
}
