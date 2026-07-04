"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, Check, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/inbox";
import { useWorkspaceOperators } from "@/hooks/useWorkspaceOperators";
import { PersonGlyph } from "@/components/icons";

interface AssigneePickerProps {
  conversation: Conversation;
  updating?: boolean;
  onAssigneeChange?: (assignedOperatorId: string | null) => Promise<unknown>;
}

export function AssigneePicker({
  conversation,
  updating = false,
  onAssigneeChange,
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { operators, loading } = useWorkspaceOperators(open);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const handleSelect = async (operatorId: string | null) => {
    setOpen(false);
    if (!onAssigneeChange) return;

    const currentId = conversation.assignee?.id ?? null;
    if (operatorId === currentId) return;

    await onAssigneeChange(operatorId);
  };

  const assignee = conversation.assignee;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        disabled={updating || !onAssigneeChange}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={assignee ? `Assigned to ${assignee.name}` : "Assign operator"}
        className="inline-flex max-w-[220px] items-center gap-2 rounded-lg border border-[#E6EAF0] px-2.5 py-1.5 text-xs hover:bg-[#F4F6FB] disabled:opacity-60"
      >
        {assignee ? (
          <>
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white",
                assignee.avatarGradient,
              )}
            >
              <PersonGlyph size={12} />
            </div>
            <span className="truncate font-semibold text-[#2C405A]">{assignee.name}</span>
          </>
        ) : (
          <>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E6EAF0] text-[#828EA1]">
              <PersonGlyph size={12} />
            </div>
            <span className="truncate text-[#828EA1]">Assign operator</span>
          </>
        )}
        <ChevronDown size={14} className="shrink-0 text-[#828EA1]" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-20 mt-1 max-h-[280px] min-w-[240px] overflow-y-auto rounded-lg border border-[#E6EAF0] bg-white py-1 shadow-lg"
        >
          {loading ? (
            <p className="px-3 py-2 text-sm text-[#828EA1]">Loading operators…</p>
          ) : (
            <>
              <button
                type="button"
                role="option"
                aria-selected={!assignee}
                onClick={() => void handleSelect(null)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F4F6FB]",
                  !assignee ? "font-semibold text-[#1972F5]" : "text-[#2C405A]",
                )}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F6FB] text-[#828EA1]">
                  <UserX size={14} />
                </span>
                <span className="flex-1 truncate">Unassigned</span>
                {!assignee && <Check size={14} className="shrink-0 text-[#1972F5]" />}
              </button>

              {operators.map((operator) => {
                const selected = assignee?.id === operator.userId;

                return (
                  <button
                    key={operator.userId}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => void handleSelect(operator.userId)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F4F6FB]",
                      selected ? "font-semibold text-[#1972F5]" : "text-[#2C405A]",
                    )}
                  >
                    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#E6EAF0]">
                      <Image
                        src={operator.avatarUrl}
                        alt=""
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                      {operator.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#40B630] ring-2 ring-white" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {operator.name}
                      {operator.self ? " (you)" : ""}
                    </span>
                    {selected && <Check size={14} className="shrink-0 text-[#1972F5]" />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
