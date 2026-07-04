"use client";

import { Globe, List, Plus, Trash2 } from "lucide-react";
import { DEFAULT_LANGUAGE_OPTIONS } from "@/lib/chatbox/search-ai-preferences";
import { cn } from "@/lib/utils";
import type { SearchAiFrequentSearch } from "@/types/search-ai";

type FrequentSearchesPanelProps = {
  title: string;
  description: string;
  addButton: string;
  emptyText: string;
  searches: SearchAiFrequentSearch[];
  defaultLanguage: string;
  overlayInstalled: boolean;
  saving?: boolean;
  languageSaving?: boolean;
  onAdd: () => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onLanguageChange: (value: string) => Promise<boolean>;
};

export function FrequentSearchesPanel({
  title,
  description,
  addButton,
  emptyText,
  searches,
  defaultLanguage,
  overlayInstalled,
  saving,
  languageSaving,
  onAdd,
  onDelete,
  onLanguageChange,
}: FrequentSearchesPanelProps) {
  return (
    <div className="overflow-hidden rounded border border-[#E3E8EF] bg-white">
      <div className="flex items-center gap-2 border-b border-[#E3E8EF] px-4 py-3">
        <List size={17} className="shrink-0 text-[#606976]" strokeWidth={1.75} />
        <span className="truncate text-sm font-semibold text-[#2c405a]">{title}</span>
      </div>
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed text-[#75869c]">{description}</p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!overlayInstalled || saving}
            onClick={() => void onAdd()}
            className={cn(
              "inline-flex h-[31px] items-center gap-1.5 rounded border border-black/10 bg-[#1972F5] px-3 text-xs font-bold text-white",
              (!overlayInstalled || saving) && "opacity-60",
            )}
          >
            <Plus size={14} strokeWidth={2.5} />
            {addButton}
          </button>
        </div>
        <div className="relative mt-4 inline-flex items-center">
          <Globe size={16} className="pointer-events-none absolute left-3 text-[#1972F5]" strokeWidth={1.75} />
          <select
            value={defaultLanguage}
            disabled={languageSaving}
            onChange={(event) => void onLanguageChange(event.target.value)}
            className={cn(
              "appearance-none rounded border border-[#1972F5] bg-[#1972F5]/10 py-1.5 pl-9 pr-8 text-sm font-semibold text-[#1972F5] outline-none",
              languageSaving && "opacity-60",
            )}
          >
            {DEFAULT_LANGUAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {searches.length === 0 ? (
          <p className="mt-8 text-center text-sm font-semibold text-[#75869c]">{emptyText}</p>
        ) : (
          <ul className="mt-6 rounded border border-[#E8EAEB]">
            {searches.map((search) => (
              <li
                key={search.id}
                className="flex items-center justify-between gap-4 border-b border-[#E8EAEB] px-3 py-3 last:border-b-0"
              >
                <p className="min-w-0 text-sm font-bold text-[#1c293b]">{search.query}</p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onDelete(search.id)}
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#E8EAEB] text-[#606976]",
                    saving && "opacity-60",
                  )}
                  aria-label={`Delete ${search.query}`}
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
