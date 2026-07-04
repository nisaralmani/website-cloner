"use client";

import { useEffect, useRef, useState } from "react";
import type { ConversationStatus } from "@/types/inbox";
import { cn } from "@/lib/utils";

export type ConversationListFiltersState = {
  status: "" | ConversationStatus;
  assignedToMe: boolean;
  unassignedOnly: boolean;
};

export const EMPTY_CONVERSATION_LIST_FILTERS: ConversationListFiltersState = {
  status: "",
  assignedToMe: false,
  unassignedOnly: false,
};

type ConversationListFiltersProps = {
  filters: ConversationListFiltersState;
  onChange: (filters: ConversationListFiltersState) => void;
};

export function ConversationListFilters({ filters, onChange }: ConversationListFiltersProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const activeCount =
    (filters.status ? 1 : 0) + (filters.assignedToMe ? 1 : 0) + (filters.unassignedOnly ? 1 : 0);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-[#F4F6FB]",
          activeCount > 0 && "bg-[#E8F0FE]",
        )}
      >
        <span className="text-sm font-semibold text-[#2C405A]">Filters</span>
        {activeCount > 0 ? (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1972F5] px-1 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-[#E6EAF0] bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#828EA1]">Status</p>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as ConversationListFiltersState["status"],
              })
            }
            className="mb-3 w-full rounded border border-[#E8EAEB] px-2 py-1.5 text-sm text-[#1C293B]"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <label className="mb-2 flex items-center gap-2 text-sm text-[#1C293B]">
            <input
              type="checkbox"
              checked={filters.assignedToMe}
              onChange={(event) =>
                onChange({
                  ...filters,
                  assignedToMe: event.target.checked,
                  unassignedOnly: event.target.checked ? false : filters.unassignedOnly,
                })
              }
            />
            Assigned to me
          </label>
          <label className="mb-3 flex items-center gap-2 text-sm text-[#1C293B]">
            <input
              type="checkbox"
              checked={filters.unassignedOnly}
              onChange={(event) =>
                onChange({
                  ...filters,
                  unassignedOnly: event.target.checked,
                  assignedToMe: event.target.checked ? false : filters.assignedToMe,
                })
              }
            />
            Unassigned only
          </label>
          <button
            type="button"
            onClick={() => onChange(EMPTY_CONVERSATION_LIST_FILTERS)}
            className="text-xs font-semibold text-[#1972F5] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
