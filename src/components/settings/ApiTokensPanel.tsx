"use client";

import { Trash2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceApiToken } from "@/types/workspace-advanced";

type ApiTokensPanelProps = {
  tokens: WorkspaceApiToken[];
  saving?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onDelete: (id: string) => Promise<boolean>;
};

export function ApiTokensPanel({
  tokens,
  saving,
  emptyTitle,
  emptyDescription,
  onDelete,
}: ApiTokensPanelProps) {
  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center rounded border border-[#E8EAEB] px-2.5 py-3.5 text-center">
        <Zap size={20} className="mb-2 text-[#1c293b]" strokeWidth={1.75} />
        <p className="text-sm font-medium text-[#1c293b]">{emptyTitle}</p>
        <p className="mt-1 text-sm text-[#75869c]">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="rounded border border-[#E8EAEB]">
      {tokens.map((token) => (
        <li
          key={token.id}
          className="flex items-center justify-between gap-4 border-b border-[#E8EAEB] px-3 py-3 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1c293b]">{token.label}</p>
            <p className="mt-1 truncate font-mono text-sm text-[#75869c]">{token.tokenPreview}</p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onDelete(token.id)}
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#E8EAEB] text-[#606976]",
              saving && "opacity-60",
            )}
            aria-label={`Delete ${token.label}`}
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
        </li>
      ))}
    </ul>
  );
}
