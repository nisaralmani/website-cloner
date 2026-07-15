"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  BookOpen,
  ChevronDown,
  Link2,
  Play,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { HelpdeskArticleModal } from "@/components/helpdesk/HelpdeskArticleModal";
import { HelpdeskCategoryModal } from "@/components/helpdesk/HelpdeskCategoryModal";
import { cn } from "@/lib/utils";
import { useHelpdesk } from "@/hooks/useHelpdesk";
import { useUpgradePlan } from "@/hooks/useUpgradePlan";
import { DOCS_HELPDESK_URL, PUBLIC_HELP_CENTER_URL } from "@/lib/docs-links";
import { appHelpdeskPath, APP_AGENT_PATH } from "@/lib/marketing-paths";
import { HELPDESK_HELP_VIDEO_URL } from "@/lib/settings-help-urls";
import type { HelpdeskArticle, HelpdeskArticleStatus } from "@/types/helpdesk";

const STATUS_CYCLE: HelpdeskArticleStatus[] = ["draft", "visible", "hidden"];

const FEATURES = [
  { icon: Users, text: "Help users help themselves" },
  { icon: Link2, text: "Link articles directly in any channel" },
  { icon: BookOpen, text: "Keep your knowledge organized" },
  { icon: TrendingUp, text: "Boost your organic visibility" },
] as const;

const STATUS_STYLES: Record<HelpdeskArticleStatus, string> = {
  draft: "bg-[#F4F4F5] text-[#5D6B98]",
  visible: "bg-[#F2F8F2] text-[#5DAC5D]",
  hidden: "bg-[#FDF4EC] text-[#E07415]",
};

function HelpdeskUpgradeOverlay({
  onUpgrade,
  onGetStarted,
  upgrading,
}: {
  onUpgrade: () => void;
  onGetStarted: () => void;
  upgrading: boolean;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/30 px-6 py-10">
      <div className="w-full max-w-[720px] rounded-lg bg-white shadow-xl">
        <div className="border-b border-[#F4F4F5] px-8 py-6 text-center">
          <h2 className="text-xl font-semibold text-[#1C293B]">
            Upgrade your plan to unlock{" "}
            <span className="text-[#1972F5]">Helpdesk</span>
          </h2>
        </div>

        <div className="px-8 py-6">
          <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#1C293B]">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-[#1C293B] text-white">
              <Search size={16} />
            </span>
            Feature Details
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#1C293B]">Helpdesk</span>
            <span className="rounded bg-[#E8F4FD] px-2 py-0.5 text-xs font-semibold text-[#1972F5]">
              Included in Essentials plan
            </span>
            <span className="rounded bg-[#E8F4FD] px-2 py-0.5 text-xs font-semibold text-[#1972F5]">
              Included in Plus plan
            </span>
          </div>

          <div className="relative mb-6 overflow-hidden rounded-lg bg-gradient-to-br from-[#1972F5] to-[#0D5FCC]">
            <div className="flex min-h-[200px] items-center justify-between px-8 py-6">
              <div className="max-w-[55%] text-white">
                <p className="text-lg font-bold leading-snug">
                  5 best practices for using your Knowledge Base
                </p>
              </div>
              <a
                href={HELPDESK_HELP_VIDEO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#1972F5] shadow-md"
                aria-label="Play video"
              >
                <Play size={24} className="ml-1" fill="currentColor" />
              </a>
            </div>
          </div>

          <p className="mb-6 text-sm leading-6 text-[#495462]">
            Bybelt Knowledge Base lets you create and organize help articles your
            users can search, browse, and share — all from a customizable,
            SEO-friendly public page. Write, format, and update content easily,
            and link articles directly from your chat with a simple shortcut.
          </p>

          <ul className="mb-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F4F6FB] text-[#1972F5]">
                  <Icon size={18} />
                </span>
                <span className="pt-1.5 text-sm font-semibold text-[#1C293B]">
                  {text}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={upgrading}
            onClick={onUpgrade}
            className="h-[42px] w-full rounded bg-[#1C293B] text-sm font-semibold text-white disabled:opacity-60"
          >
            {upgrading ? "Upgrading…" : "Upgrade your Bybelt plan"}
          </button>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[#75869C]">
            <span>Refund if unsatisfied</span>
            <span>5/7 Live chat support</span>
          </div>
        </div>

        <div className="flex border-t border-[#F4F4F5]">
          <button
            type="button"
            className="flex-1 border-b-2 border-[#1972F5] py-3 text-sm font-semibold text-[#1972F5]"
          >
            Plans Details
          </button>
          <button
            type="button"
            className="flex-1 py-3 text-sm font-semibold text-[#75869C]"
          >
            Payment
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onGetStarted}
        className="fixed bottom-6 right-6 flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-lg"
      >
        <div className="relative h-10 w-10">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#E8EAEB"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#40B630"
              strokeWidth="3"
              strokeDasharray="94.2"
              strokeDashoffset="68.8"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#1C293B]">
            27%
          </span>
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-[#1C293B]">Get Started</p>
          <p className="text-xs text-[#75869C]">Nisar</p>
        </div>
        <Sparkles size={16} className="text-[#F97316]" />
      </button>
    </div>
  );
}

function ArticleRow({
  article,
  deleting,
  updatingStatus,
  onDelete,
  onToggleStatus,
  onPreview,
}: {
  article: HelpdeskArticle;
  deleting: boolean;
  updatingStatus: boolean;
  onDelete: (articleId: string) => void;
  onToggleStatus: (articleId: string, status: HelpdeskArticleStatus) => void;
  onPreview: (articleId: string) => void;
}) {
  const nextStatus =
    STATUS_CYCLE[(STATUS_CYCLE.indexOf(article.status) + 1) % STATUS_CYCLE.length];

  return (
    <tr className="border-b border-[#F4F4F5] text-sm font-semibold text-[#1C293B]">
      <td className="px-8 py-3">
        <button
          type="button"
          onClick={() => onPreview(article.id)}
          className="text-left hover:text-[#1972F5]"
        >
          {article.title}
        </button>
      </td>
      <td className="px-3 py-3">
        <button
          type="button"
          disabled={updatingStatus}
          onClick={() => onToggleStatus(article.id, nextStatus)}
          className={cn(
            "inline-flex rounded px-2 py-0.5 text-xs font-semibold capitalize disabled:opacity-60",
            STATUS_STYLES[article.status],
          )}
        >
          {updatingStatus ? "…" : article.status}
        </button>
      </td>
      <td className="px-3 py-3">
        {article.views} views · {article.helpfulCount} helpful
      </td>
      <td className="px-3 py-3">{article.lastUpdate}</td>
      <td className="px-8 py-3 text-right">
        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete(article.id)}
          className="text-xs font-semibold text-[#EF4444] disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}

export default function HelpdeskPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [previewArticleId, setPreviewArticleId] = useState<string | null>(null);
  const [previewCategoryId, setPreviewCategoryId] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const { openBilling, opening: upgrading } = useUpgradePlan();
  const {
    articles,
    categories,
    articleTotal,
    categoryTotal,
    helpdeskEnabled,
    loading,
    error,
    view,
    reload,
  } = useHelpdesk(pathname, searchQuery);

  useEffect(() => {
    if (!actionsOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionsOpen]);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setSearchQuery(searchInput);
    }
  };

  const handleCreate = async () => {
    if (!helpdeskEnabled) return;
    setCreating(true);
    try {
      if (view === "categories") {
        const response = await fetch("/api/helpdesk/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: `Category ${new Date().toLocaleDateString()}` }),
        });
        if (!response.ok) throw new Error("Failed to create category");
      } else {
        const response = await fetch("/api/helpdesk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Article ${new Date().toLocaleDateString()}`,
            status: "draft",
          }),
        });
        if (!response.ok) throw new Error("Failed to create article");
      }
      await reload();
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    setDeletingId(articleId);
    try {
      const response = await fetch(`/api/helpdesk/${articleId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete article");
      await reload();
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleArticleStatus = async (
    articleId: string,
    status: HelpdeskArticleStatus,
  ) => {
    setUpdatingStatusId(articleId);
    try {
      const response = await fetch(`/api/helpdesk/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update article status");
      await reload();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleRenameCategory = async (categoryId: string, currentName: string) => {
    const nextName = window.prompt("Category name", currentName)?.trim();
    if (!nextName || nextName === currentName) return;

    const response = await fetch(`/api/helpdesk/categories/${categoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    });
    if (!response.ok) return;
    await reload();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setDeletingCategoryId(categoryId);
    try {
      const response = await fetch(`/api/helpdesk/categories/${categoryId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete category");
      await reload();
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleUpgrade = async () => {
    await openBilling();
  };

  const isCategories = view === "categories";
  const headerLabel = isCategories
    ? `${categoryTotal} Categories`
    : `${articleTotal} Articles`;

  const showUpgrade = !loading && !error && !helpdeskEnabled;
  const showArticleRows =
    helpdeskEnabled && !isCategories && !loading && !error && articles.length > 0;
  const showCategoryRows =
    helpdeskEnabled && isCategories && !loading && !error && categories.length > 0;

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-[#F4F4F5] px-8 py-4">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-[#2C405A]" strokeWidth={1.75} />
          <h1 className="text-base font-semibold text-[#2C405A]">{headerLabel}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-[250px] items-center gap-2 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2">
            <Search size={18} className="shrink-0 text-[#828EA1]" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search"
              className="w-full bg-transparent text-sm text-[#1C293B] outline-none placeholder:text-[#828EA1]"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              window.open(DOCS_HELPDESK_URL, "_blank", "noopener,noreferrer")
            }
            className="h-[37px] rounded bg-[#1972F5] px-4 text-sm font-semibold text-white"
          >
            Documentation
          </button>
          <a
            href={PUBLIC_HELP_CENTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[37px] items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-4 text-sm font-semibold text-[#333E4F]"
          >
            Public help center
          </a>
          <button
            type="button"
            disabled={creating || !helpdeskEnabled}
            onClick={() => void handleCreate()}
            className="h-[37px] rounded bg-[#1C293B] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {creating
              ? "Creating…"
              : isCategories
                ? "New Category"
                : "New Article"}
          </button>
          <div ref={actionsRef} className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen((open) => !open)}
              className="inline-flex h-[37px] items-center gap-1 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-semibold text-[#333E4F]"
            >
              Actions
              <ChevronDown size={16} />
            </button>
            {actionsOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-[#E8EAEB] bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    router.push(appHelpdeskPath("categories"));
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
                >
                  View categories
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    router.push(appHelpdeskPath("articles"));
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
                >
                  View articles
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    void reload();
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
                >
                  Refresh list
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-auto bg-[#FBFBFB]">
        {loading ? (
          <p className="px-8 py-12 text-sm text-[#828EA1]">Loading helpdesk…</p>
        ) : error ? (
          <p className="px-8 py-12 text-sm text-[#828EA1]">{error}</p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#FBFBFB]">
              {isCategories ? (
                <tr className="border-b border-[#F4F4F5] text-[13.5px] font-semibold text-[#75869C]">
                  <th className="px-8 py-2">Category Name</th>
                  <th className="px-3 py-2">Articles</th>
                  <th className="px-8 py-2 text-right">Actions</th>
                </tr>
              ) : (
                <tr className="border-b border-[#F4F4F5] text-[13.5px] font-semibold text-[#75869C]">
                  <th className="px-8 py-2">Article Title</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Statistics</th>
                  <th className="px-3 py-2">Last Update</th>
                  <th className="px-8 py-2 text-right">Actions</th>
                </tr>
              )}
            </thead>
            {showArticleRows && (
              <tbody>
                {articles.map((article) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    deleting={deletingId === article.id}
                    updatingStatus={updatingStatusId === article.id}
                    onDelete={(articleId) => void handleDeleteArticle(articleId)}
                    onToggleStatus={(articleId, status) =>
                      void handleToggleArticleStatus(articleId, status)
                    }
                    onPreview={setPreviewArticleId}
                  />
                ))}
              </tbody>
            )}
            {showCategoryRows && (
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-[#F4F4F5] text-sm font-semibold text-[#1C293B]"
                  >
                    <td className="px-8 py-3">
                      <button
                        type="button"
                        onClick={() => setPreviewCategoryId(category.id)}
                        className="text-left hover:text-[#1972F5]"
                      >
                        {category.name}
                      </button>
                    </td>
                    <td className="px-3 py-3">{category.articleCount}</td>
                    <td className="px-8 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleRenameCategory(category.id, category.name)}
                          className="text-xs font-semibold text-[#1972F5]"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          disabled={deletingCategoryId === category.id}
                          onClick={() => void handleDeleteCategory(category.id)}
                          className="text-xs font-semibold text-[#EF4444] disabled:opacity-60"
                        >
                          {deletingCategoryId === category.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        )}

        {showUpgrade && (
          <HelpdeskUpgradeOverlay
            onUpgrade={() => void handleUpgrade()}
            onGetStarted={() => router.push(APP_AGENT_PATH)}
            upgrading={upgrading}
          />
        )}
      </div>

      <HelpdeskArticleModal
        articleId={previewArticleId}
        onClose={() => setPreviewArticleId(null)}
        onUpdated={() => void reload()}
      />

      <HelpdeskCategoryModal
        categoryId={previewCategoryId}
        onClose={() => setPreviewCategoryId(null)}
      />
    </div>
  );
}
