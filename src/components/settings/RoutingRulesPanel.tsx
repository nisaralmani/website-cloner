"use client";

import { Globe, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoutingRule } from "@/types/routing-rules";

type RoutingRulesPanelProps = {
  rules: RoutingRule[];
  saving?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onDelete: (id: string) => Promise<boolean>;
  onToggle: (id: string, enabled: boolean) => Promise<boolean>;
};

export function RoutingRulesPanel({
  rules,
  saving,
  emptyTitle,
  emptyDescription,
  onDelete,
  onToggle,
}: RoutingRulesPanelProps) {
  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center rounded border border-[#E8EAEB] px-2.5 py-3.5 text-center">
        <Globe size={20} className="mb-2 text-[#1c293b]" strokeWidth={1.75} />
        <p className="text-sm font-medium text-[#1c293b]">{emptyTitle}</p>
        <p className="mt-1 text-sm text-[#75869c]">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="rounded border border-[#E8EAEB]">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className="flex items-start justify-between gap-4 border-b border-[#E8EAEB] px-3 py-3 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1c293b]">{rule.name}</p>
            <p className="mt-1 text-sm text-[#75869c]">{rule.action}</p>
            {rule.assignTarget && (
              <p className="mt-1 text-sm text-[#75869c]">Target: {rule.assignTarget}</p>
            )}
            {rule.matchContains && (
              <p className="mt-1 text-sm text-[#75869c]">Match: {rule.matchContains}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={rule.enabled}
              disabled={saving}
              onClick={() => void onToggle(rule.id, !rule.enabled)}
              className={cn(
                "relative h-6 w-[42px] rounded-[20px] transition-colors",
                rule.enabled ? "bg-[#1972F5]" : "bg-[#F4F4F5]",
                saving && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full transition-all",
                  rule.enabled ? "left-[22px] bg-white" : "left-1 bg-[#bbbfc4]",
                )}
              />
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onDelete(rule.id)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded border border-[#E8EAEB] text-[#606976]",
                saving && "opacity-60",
              )}
              aria-label={`Delete ${rule.name}`}
            >
              <Trash2 size={15} strokeWidth={1.75} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
