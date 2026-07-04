"use client";

import { useCallback, useEffect, useState } from "react";
import type { HelpdeskArticle, HelpdeskCategory } from "@/types/helpdesk";
import { helpdeskViewFromPath } from "@/lib/helpdesk-routes";

export function useHelpdesk(pathname: string, searchQuery = "") {
  const [articles, setArticles] = useState<HelpdeskArticle[]>([]);
  const [categories, setCategories] = useState<HelpdeskCategory[]>([]);
  const [articleTotal, setArticleTotal] = useState(0);
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [helpdeskEnabled, setHelpdeskEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const view = helpdeskViewFromPath(pathname);
  const status =
    view === "draft" || view === "visible" || view === "hidden" ? view : "all";

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        view: view === "categories" ? "categories" : "articles",
      });
      if (view !== "categories" && status !== "all") {
        params.set("status", status);
      }
      const query = searchQuery.trim();
      if (query) params.set("q", query);

      const response = await fetch(`/api/helpdesk?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load helpdesk");
      }
      const data = (await response.json()) as {
        articles: HelpdeskArticle[];
        categories: HelpdeskCategory[];
        helpdeskEnabled: boolean;
        articleTotal: number;
        categoryTotal: number;
      };
      setArticles(data.articles);
      setCategories(data.categories);
      setHelpdeskEnabled(data.helpdeskEnabled);
      setArticleTotal(data.articleTotal);
      setCategoryTotal(data.categoryTotal);
    } catch {
      setError("Unable to load helpdesk.");
      setArticles([]);
      setCategories([]);
      setHelpdeskEnabled(false);
      setArticleTotal(0);
      setCategoryTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, status, view]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    articles,
    categories,
    articleTotal,
    categoryTotal,
    helpdeskEnabled,
    loading,
    error,
    view,
    reload,
  };
}
