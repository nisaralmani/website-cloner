"use client";

import { AlertTriangle, Ban, ListFilter, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeCountLabel } from "@/lib/triage/mappers";
import type { TriageRule, TriageRuleset } from "@/types/triage";

type TriageRulesetSectionProps = {
  ruleset: TriageRuleset;
  title: string;
  addButton: string;
  emptyTitle: string;
  emptyDescription: string;
  rules: TriageRule[];
  activeCount: number;
  saving?: boolean;
  disclaimer?: {
    title: string;
    body: string;
    bodyBold?: string;
  };
  onAdd: (ruleset: TriageRuleset) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onToggle: (id: string, enabled: boolean) => Promise<boolean>;
};

export function TriageRulesetSection({
  ruleset,
  title,
  addButton,
  emptyTitle,
  emptyDescription,
  rules,
  activeCount,
  saving,
  disclaimer,
  onAdd,
  onDelete,
  onToggle,
}: TriageRulesetSectionProps) {
  const RulesetIcon = ruleset === "block" ? Ban : ListFilter;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <RulesetIcon size={18} className="shrink-0 text-[#75869c]" strokeWidth={1.75} />
          <h3 className="text-[18px] font-bold leading-7 text-[#1c293b]">{title}</h3>
          <span className="text-sm font-normal text-[#75869c]">{activeCountLabel(activeCount)}</span>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onAdd(ruleset)}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded border border-[#1972F5] bg-white px-3 text-[13px] font-bold text-[#1972F5]",
            saving && "opacity-60",
          )}
        >
          {addButton}
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>

      {disclaimer && (
        <div className="mt-4 rounded border border-[#FDE0B5] bg-[#FFF8EE] px-4 py-4">
          <div className="flex items-start gap-2 text-sm text-[#2c405a]">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-[#FD7B1F]"
              strokeWidth={2}
            />
            <div>
              <p className="font-semibold text-[#1c293b]">{disclaimer.title}</p>
              <p className="mt-2.5 leading-relaxed">
                {disclaimer.body}{" "}
                {disclaimer.bodyBold && (
                  <span className="font-semibold">{disclaimer.bodyBold}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        {rules.length === 0 ? (
          <div className="rounded border border-[#E8EAEB] px-2.5 py-3.5 text-center">
            <p className="text-sm font-medium text-[#1c293b]">{emptyTitle}</p>
            <p className="mt-1 text-sm text-[#75869c]">{emptyDescription}</p>
          </div>
        ) : (
          <ul className="rounded border border-[#E8EAEB]">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-start justify-between gap-4 border-b border-[#E8EAEB] px-3 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#1c293b]">{rule.name}</p>
                    <span className="rounded bg-[#F4F4F5] px-2 py-0.5 text-xs font-semibold text-[#606976]">
                      {rule.action}
                    </span>
                  </div>
                  {rule.matchContains && (
                    <p className="mt-1 text-sm text-[#75869c]">
                      Contains &quot;{rule.matchContains}&quot;
                    </p>
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
        )}
      </div>
    </div>
  );
}
