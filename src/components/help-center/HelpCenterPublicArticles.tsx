"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import type { HelpdeskArticle } from "@/types/helpdesk";
import { helpCenterArticlePath } from "@/lib/marketing-paths";
import { PUBLIC_HELPDESK_DOMAIN, publicHelpdeskListApiPath } from "@/lib/public-helpdesk";

type HelpCenterPublicArticlesProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function HelpCenterSearchInput({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
      <label htmlFor="help-center-search" className="sr-only">
        Search help articles
      </label>
      <input
        id="help-center-search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search help articles…"
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
      />
    </div>
  );
}

export default function HelpCenterPublicArticles({
  query,
  initialArticles = [],
}: Omit<HelpCenterPublicArticlesProps, "onQueryChange"> & { initialArticles?: HelpdeskArticle[] }) {
  const [articles, setArticles] = useState<HelpdeskArticle[]>(initialArticles);
  const [loading, setLoading] = useState(initialArticles.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(publicHelpdeskListApiPath(PUBLIC_HELPDESK_DOMAIN));
        if (!response.ok) {
          throw new Error("Unable to load help articles.");
        }
        const data = (await response.json()) as { articles?: HelpdeskArticle[] };
        if (!cancelled) {
          setArticles(data.articles ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load help articles.");
          setArticles([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return articles;
    return articles.filter((article) => {
      const haystack = `${article.title} ${article.body ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [articles, query]);

  if (loading) {
    return <p className="mt-8 text-center text-sm text-[#64748b]">Loading articles…</p>;
  }

  if (error) {
    return <p className="mt-8 text-center text-sm text-[#64748b]">{error}</p>;
  }

  if (filtered.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-[#64748b]">
        {query.trim() ? "No articles match your search." : "No published articles yet."}
      </p>
    );
  }

  return (
    <ul className="mt-8 divide-y divide-[#E2E8F0] rounded-2xl border border-[#E2E8F0] bg-white">
      {filtered.map((article) => (
        <li key={article.id}>
          <Link
            href={helpCenterArticlePath(article.id)}
            className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-[#F8FAFC]"
          >
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#1972F5]" aria-hidden />
            <span>
              <span className="block text-[15px] font-semibold text-[#0f172a]">{article.title}</span>
              {article.body ? (
                <span className="mt-1 line-clamp-2 block text-sm text-[#64748b]">{article.body}</span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
