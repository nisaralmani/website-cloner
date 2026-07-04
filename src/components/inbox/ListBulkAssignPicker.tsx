"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, UserX } from "lucide-react";
import { useWorkspaceOperators } from "@/hooks/useWorkspaceOperators";
import { PersonGlyph } from "@/components/icons";

export function ListBulkAssignPicker({
  selectedCount,
  updating,
  onAssign,
}: {
  selectedCount: number;
  updating?: boolean;
  onAssign?: (assignedOperatorId: string | null) => Promise<unknown>;
}) {
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
    if (!onAssign) return;
    await onAssign(operatorId);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        disabled={updating || !onAssign}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Assign ${selectedCount} selected conversations`}
        className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#1972F5] text-white ring-2 ring-[#1972F5]/20 disabled:opacity-60"
      >
        <PersonGlyph size={16} />
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#25374F] px-1 text-[10px] font-bold text-white">
          {selectedCount}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute bottom-full left-1/2 z-20 mb-2 max-h-[280px] min-w-[240px] -translate-x-1/2 overflow-y-auto rounded-lg border border-[#E6EAF0] bg-white py-1 shadow-lg"
        >
          <p className="border-b border-[#E6EAF0] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#828EA1]">
            Assign {selectedCount} conversation{selectedCount === 1 ? "" : "s"}
          </p>
          {loading ? (
            <p className="px-3 py-2 text-sm text-[#828EA1]">Loading operators…</p>
          ) : (
            <>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => void handleSelect(null)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#2C405A] hover:bg-[#F4F6FB]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F6FB] text-[#828EA1]">
                  <UserX size={14} />
                </span>
                <span className="flex-1 truncate">Unassigned</span>
              </button>

              {operators.map((operator) => (
                <button
                  key={operator.userId}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => void handleSelect(operator.userId)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#2C405A] hover:bg-[#F4F6FB]"
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
                  <Check size={14} className="shrink-0 text-transparent" />
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
