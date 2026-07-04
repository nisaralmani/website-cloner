"use client";

import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRIAGE_ACTIONS, TRIAGE_ACTION_FILTER_ALL } from "@/lib/triage/validation";

type TriageFiltersBarProps = {
  label: string;
  searchPlaceholder: string;
  actionOptions: string[];
  query: string;
  actionFilter: string;
  saving?: boolean;
  onQueryChange: (value: string) => void;
  onActionFilterChange: (value: string) => void;
};

export function TriageFiltersBar({
  label,
  searchPlaceholder,
  actionOptions,
  query,
  actionFilter,
  saving,
  onQueryChange,
  onActionFilterChange,
}: TriageFiltersBarProps) {
  const options = actionOptions.includes(TRIAGE_ACTION_FILTER_ALL)
    ? actionOptions
    : [TRIAGE_ACTION_FILTER_ALL, ...TRIAGE_ACTIONS];

  return (
    <div className={cn("mb-6 w-full", saving && "opacity-70")}>
      <label className="mb-2 block text-sm font-bold text-[#606976]">{label}</label>
      <div className="flex gap-2">
        <div className="flex h-9 min-w-0 flex-1 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2">
          <Search size={20} className="mr-2 shrink-0 text-[#606976]" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            disabled={saving}
            placeholder={searchPlaceholder}
            onChange={(event) => onQueryChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#1c293b] outline-none placeholder:text-[#828ea1]"
          />
        </div>
        <div className="relative w-[200px] shrink-0">
          <select
            value={actionFilter}
            disabled={saving}
            onChange={(event) => onActionFilterChange(event.target.value)}
            className="flex h-9 w-full appearance-none rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-bold text-[#1c293b] outline-none"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#828ea1]"
          />
        </div>
      </div>
    </div>
  );
}
