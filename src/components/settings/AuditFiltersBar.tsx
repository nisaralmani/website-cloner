"use client";

import { Calendar, ChevronDown, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransparencyOperatorOption } from "@/types/workspace-transparency";

type AuditFiltersBarProps = {
  operator: string;
  action: string;
  operatorOptions: TransparencyOperatorOption[];
  actionOptions: string[];
  dateFrom: string;
  dateTo: string;
  dateDisabled?: boolean;
  saving?: boolean;
  onOperatorChange: (userId: string) => void;
  onActionChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
};

export function AuditFiltersBar({
  operator,
  action,
  operatorOptions,
  actionOptions,
  dateFrom,
  dateTo,
  dateDisabled,
  saving,
  onOperatorChange,
  onActionChange,
  onDateFromChange,
  onDateToChange,
}: AuditFiltersBarProps) {
  return (
    <div className={cn("mb-6 w-full", (dateDisabled || saving) && "opacity-60")}>
      <label className="mb-2 block text-sm font-bold text-[#606976]">Filter by</label>
      <div className="flex gap-2">
        <div className="flex h-10 w-[313px] shrink-0 items-center gap-1 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2 text-sm text-[#828ea1]">
          <Calendar size={20} className="mr-1 shrink-0 text-[#606976]" strokeWidth={1.75} />
          <input
            type="date"
            value={dateFrom}
            disabled={dateDisabled || saving}
            onChange={(event) => onDateFromChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-normal text-[#1c293b] outline-none disabled:opacity-60"
            aria-label="Start date"
          />
          <span className="mx-0.5">-</span>
          <input
            type="date"
            value={dateTo}
            disabled={dateDisabled || saving}
            onChange={(event) => onDateToChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-normal text-[#1c293b] outline-none disabled:opacity-60"
            aria-label="End date"
          />
        </div>
        <div className="flex min-w-0 flex-1 gap-2">
          <div className="relative min-w-0 flex-1">
            <UserRound
              size={20}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#606976]"
              strokeWidth={1.75}
            />
            <select
              value={
                operatorOptions.find((option) => option.name === operator)?.userId ??
                operatorOptions[0]?.userId ??
                ""
              }
              disabled={saving}
              onChange={(event) => onOperatorChange(event.target.value)}
              className="flex h-10 w-full appearance-none truncate rounded border border-[#E8EAEB] bg-[#F8F9F9] py-0 pl-10 pr-8 text-sm font-bold text-[#1c293b] outline-none"
            >
              {operatorOptions.map((option) => (
                <option key={option.userId} value={option.userId}>
                  {option.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#828ea1]"
            />
          </div>
          <div className="relative min-w-0 flex-1">
            <Plus
              size={20}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#606976]"
              strokeWidth={1.75}
            />
            <select
              value={action}
              disabled={saving}
              onChange={(event) => onActionChange(event.target.value)}
              className="flex h-10 w-full appearance-none truncate rounded border border-[#E8EAEB] bg-[#F8F9F9] py-0 pl-10 pr-8 text-sm font-bold text-[#1c293b] outline-none"
            >
              {actionOptions.map((option) => (
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
    </div>
  );
}
