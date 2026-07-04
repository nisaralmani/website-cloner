"use client";

import { ChevronsUpDown, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageShortcutGroup } from "@/types/message-shortcuts";

type MessageShortcutsManageProps = {
  title: string;
  subheading: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  groups: MessageShortcutGroup[];
  query: string;
  saving?: boolean;
  onQueryChange: (query: string) => void;
  onDelete: (id: string) => Promise<boolean>;
};

export function MessageShortcutsManage({
  title,
  subheading,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  groups,
  query,
  saving,
  onQueryChange,
  onDelete,
}: MessageShortcutsManageProps) {
  const hasShortcuts = groups.some((group) => group.shortcuts.length > 0);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h3 className="text-[18px] font-bold leading-7 text-[#1c293b]">{title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-[180px] items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2">
            <Search size={18} className="mr-2 shrink-0 text-[#606976]" strokeWidth={1.75} />
            <input
              type="text"
              value={query}
              disabled={saving}
              placeholder={searchPlaceholder}
              onChange={(event) => onQueryChange(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-[#1c293b] outline-none placeholder:text-[#828ea1]"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#E8EAEB] bg-[#F4F4F5] text-[#606976]"
          >
            <ChevronsUpDown size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-[#75869c]">{subheading}</p>

      {!hasShortcuts ? (
        <div className="rounded border border-[#E8EAEB] px-2.5 py-3.5 text-center">
          <p className="text-sm font-medium text-[#1c293b]">{emptyTitle}</p>
          <p className="mt-1 text-sm text-[#75869c]">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.tag} className="rounded border border-[#E8EAEB]">
              <div className="border-b border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 text-sm font-bold text-[#606976]">
                {group.tag}
              </div>
              <ul>
                {group.shortcuts.map((shortcut) => (
                  <li
                    key={shortcut.id}
                    className="flex items-start justify-between gap-4 border-b border-[#E8EAEB] px-3 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1c293b]">{shortcut.bang}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[#75869c]">{shortcut.message}</p>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void onDelete(shortcut.id)}
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#E8EAEB] text-[#606976]",
                        saving && "opacity-60",
                      )}
                      aria-label={`Delete ${shortcut.bang}`}
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
