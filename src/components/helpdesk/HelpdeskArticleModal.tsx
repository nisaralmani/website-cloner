"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useSession } from "@/components/providers/SessionProvider";
import type { HelpdeskArticle, HelpdeskCategory } from "@/types/helpdesk";
import {
  publicHelpdeskArticleApiPath,
  publicHelpdeskArticleHelpfulApiPath,
} from "@/lib/public-helpdesk";

type HelpdeskArticleModalProps = {
  articleId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
};

export function HelpdeskArticleModal({
  articleId,
  onClose,
  onUpdated,
}: HelpdeskArticleModalProps) {
  const { workspace } = useSession();
  const publicDomain = workspace?.domain?.trim() || "fashionsis.com";
  const [article, setArticle] = useState<HelpdeskArticle | null>(null);
  const [categories, setCategories] = useState<HelpdeskCategory[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicPreview, setPublicPreview] = useState<{
    title: string;
    body: string;
    views: number;
  } | null>(null);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState<number | null>(null);
  const [submittingHelpful, setSubmittingHelpful] = useState(false);

  useEffect(() => {
    if (!articleId) {
      setArticle(null);
      setPublicPreview(null);
      setHelpfulCount(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const [articleRes, categoriesRes] = await Promise.all([
          fetch(`/api/helpdesk/${articleId}`),
          fetch("/api/helpdesk/categories"),
        ]);
        if (!articleRes.ok) throw new Error("Failed to load article");

        const articleData = (await articleRes.json()) as { article: HelpdeskArticle };
        const categoriesData = categoriesRes.ok
          ? ((await categoriesRes.json()) as { categories: HelpdeskCategory[] })
          : { categories: [] };

        if (!cancelled) {
          setArticle(articleData.article);
          setTitle(articleData.article.title);
          setBody(articleData.article.body ?? "");
          setCategoryId(articleData.article.categoryId ?? "");
          setCategories(categoriesData.categories);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load article.");
          setArticle(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const handleSave = async () => {
    if (!articleId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/helpdesk/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          categoryId: categoryId || null,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save article");
      }
      const data = (await response.json()) as { article: HelpdeskArticle };
      setArticle(data.article);
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save article.");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadPublicPreview = async () => {
    if (!articleId) return;
    setLoadingPublic(true);
    setError(null);
    try {
      const response = await fetch(publicHelpdeskArticleApiPath(articleId, publicDomain));
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Article is not publicly visible");
      }
      const data = (await response.json()) as {
        article: { title: string; body?: string; views: number };
      };
      setPublicPreview({
        title: data.article.title,
        body: data.article.body ?? "",
        views: data.article.views,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load public preview.");
      setPublicPreview(null);
    } finally {
      setLoadingPublic(false);
    }
  };

  const handleHelpfulVote = async () => {
    if (!articleId) return;
    setSubmittingHelpful(true);
    setError(null);
    try {
      const response = await fetch(publicHelpdeskArticleHelpfulApiPath(articleId, publicDomain), { method: "POST" },
      );
      if (!response.ok) {
        throw new Error("Unable to submit helpful vote");
      }
      const data = (await response.json()) as { helpfulCount: number };
      setHelpfulCount(data.helpfulCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit helpful vote.");
    } finally {
      setSubmittingHelpful(false);
    }
  };

  if (!articleId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F4F4F5] px-5 py-4">
          <h2 className="text-base font-semibold text-[#1C293B]">Article Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#828EA1] hover:text-[#1C293B]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error ? <p className="mb-3 text-sm text-[#EF4444]">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-[#828EA1]">Loading article…</p>
          ) : article ? (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-[#75869C]">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 text-sm text-[#1C293B]"
                />
              </label>
              <div>
                <p className="text-xs font-semibold uppercase text-[#75869C]">Status</p>
                <p className="mt-1 text-sm capitalize text-[#1C293B]">{article.status}</p>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-[#75869C]">Category</span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="mt-1 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 text-sm text-[#1C293B]"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-[#75869C]">Body</span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 text-sm leading-6 text-[#495462]"
                />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="rounded bg-[#1972F5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <div className="border-t border-[#F4F4F5] pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-[#75869C]">
                    Public preview
                  </p>
                  <button
                    type="button"
                    disabled={loadingPublic}
                    onClick={() => void handleLoadPublicPreview()}
                    className="text-xs font-semibold text-[#1972F5] disabled:opacity-60"
                  >
                    {loadingPublic ? "Loading…" : "Load preview"}
                  </button>
                </div>
                {publicPreview ? (
                  <div className="mt-3 rounded border border-[#E8EAEB] bg-[#F8F9F9] p-3">
                    <p className="text-sm font-semibold text-[#1C293B]">{publicPreview.title}</p>
                    <p className="mt-1 text-xs text-[#75869C]">{publicPreview.views} views</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#495462]">
                      {publicPreview.body || "No body content."}
                    </p>
                    <div className="mt-3 flex items-center gap-3 border-t border-[#E8EAEB] pt-3">
                      <span className="text-sm text-[#75869C]">Was this helpful?</span>
                      <button
                        type="button"
                        disabled={submittingHelpful}
                        onClick={() => void handleHelpfulVote()}
                        className="rounded bg-[#1972F5] px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {submittingHelpful ? "…" : "Yes"}
                      </button>
                      {helpfulCount !== null ? (
                        <span className="text-xs text-[#75869C]">{helpfulCount} found helpful</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
