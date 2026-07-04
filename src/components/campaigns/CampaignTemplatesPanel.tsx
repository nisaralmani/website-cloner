"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { campaignsTemplateCategoryFromPath } from "@/lib/campaigns-routes";
import { useCampaignTemplates } from "@/hooks/useCampaignTemplates";
import type { CampaignTemplate } from "@/types/campaigns";

const CATEGORY_STYLES: Record<CampaignTemplate["category"], string> = {
  bybelt: "bg-[#E8F0FE] text-[#1972F5]",
  yours: "bg-[#F2F8F2] text-[#5DAC5D]",
};

function TemplateRow({
  template,
  deleting,
  updatingCategory,
  onDelete,
  onRename,
  onToggleCategory,
}: {
  template: CampaignTemplate;
  deleting: boolean;
  updatingCategory: boolean;
  onDelete: (templateId: string) => void;
  onRename: (template: CampaignTemplate) => void;
  onToggleCategory: (template: CampaignTemplate) => void;
}) {
  return (
    <tr className="border-b border-[#F4F4F5] text-sm font-semibold text-[#1C293B]">
      <td className="px-8 py-3">
        <button
          type="button"
          onClick={() => onRename(template)}
          className="text-left hover:text-[#1972F5]"
        >
          {template.name}
        </button>
      </td>
      <td className="px-3 py-3">
        <button
          type="button"
          disabled={updatingCategory}
          onClick={() => onToggleCategory(template)}
          className={cn(
            "inline-flex rounded px-2 py-0.5 text-xs font-semibold capitalize disabled:opacity-60",
            CATEGORY_STYLES[template.category],
          )}
        >
          {updatingCategory ? "…" : template.category}
        </button>
      </td>
      <td className="px-8 py-3 text-right">
        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete(template.id)}
          className="text-xs font-semibold text-[#EF4444] disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}

export default function CampaignTemplatesPanel() {
  const pathname = usePathname();
  const category = campaignsTemplateCategoryFromPath(pathname);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);
  const { templates, loading, error, reload } = useCampaignTemplates(category);

  const headerLabel =
    category === "bybelt"
      ? "Bybelt Templates"
      : category === "yours"
        ? "Your Templates"
        : "All Templates";

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/campaigns/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Template ${new Date().toLocaleDateString()}`,
          category: category === "yours" ? "yours" : "bybelt",
        }),
      });
      if (!response.ok) throw new Error("Failed to create template");
      await reload();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    setDeletingId(templateId);
    try {
      const response = await fetch(`/api/campaigns/templates/${templateId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete template");
      await reload();
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async (template: CampaignTemplate) => {
    const nextName = window.prompt("Template name", template.name)?.trim();
    if (!nextName || nextName === template.name) return;

    const response = await fetch(`/api/campaigns/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    });
    if (!response.ok) return;
    await reload();
  };

  const handleToggleCategory = async (template: CampaignTemplate) => {
    const nextCategory = template.category === "bybelt" ? "yours" : "bybelt";
    setUpdatingCategoryId(template.id);
    try {
      const response = await fetch(`/api/campaigns/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: nextCategory }),
      });
      if (!response.ok) throw new Error("Failed to update category");
      await reload();
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  const showEmpty = !loading && !error && templates.length === 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-[#F4F4F5] px-8 py-4">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-[#2C405A]" strokeWidth={1.75} />
          <h1 className="text-base font-semibold text-[#2C405A]">{headerLabel}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleCreate()}
            className="h-[37px] rounded bg-[#1C293B] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {creating ? "Creating…" : "New Template"}
          </button>
          <button
            type="button"
            className="inline-flex h-[37px] items-center gap-1 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-semibold text-[#333E4F]"
          >
            Actions
            <ChevronDown size={16} />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto bg-[#FBFBFB]">
        {loading ? (
          <p className="px-8 py-12 text-sm text-[#828EA1]">Loading templates…</p>
        ) : error ? (
          <p className="px-8 py-12 text-sm text-[#828EA1]">{error}</p>
        ) : showEmpty ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center px-8 py-12 text-center">
            <Search size={32} className="text-[#828EA1]" />
            <h2 className="mt-4 text-lg font-semibold text-[#1C293B]">No templates yet</h2>
            <p className="mt-2 max-w-md text-sm text-[#495462]">
              Create a template to reuse campaign content across sends.
            </p>
            <button
              type="button"
              disabled={creating}
              onClick={() => void handleCreate()}
              className="mt-6 h-[37px] rounded bg-[#1C293B] px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {creating ? "Creating…" : "New Template"}
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#FBFBFB]">
              <tr className="border-b border-[#F4F4F5] text-[13.5px] font-semibold text-[#75869C]">
                <th className="px-8 py-2">Template Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-8 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  deleting={deletingId === template.id}
                  updatingCategory={updatingCategoryId === template.id}
                  onDelete={(templateId) => void handleDelete(templateId)}
                  onRename={(item) => void handleRename(item)}
                  onToggleCategory={(item) => void handleToggleCategory(item)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
