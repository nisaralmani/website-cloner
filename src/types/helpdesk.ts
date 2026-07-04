export type HelpdeskArticleStatus = "draft" | "visible" | "hidden";

export interface HelpdeskArticle {
  id: string;
  title: string;
  body?: string;
  status: HelpdeskArticleStatus;
  views: number;
  helpfulCount: number;
  lastUpdate: string;
  categoryId?: string;
}

export interface HelpdeskCategory {
  id: string;
  name: string;
  articleCount: number;
}

export interface HelpdeskSummary {
  helpdeskEnabled: boolean;
  articleTotal: number;
  categoryTotal: number;
}
