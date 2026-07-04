"use client";

import { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import type { ConversationStatus } from "@/types/inbox";

export function ListBulkStatusPicker({
  selectedCount,
  updating,
  onStatusChange,
}: {
  selectedCount: number;
  updating?: boolean;
  onStatusChange?: (status: ConversationStatus) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);

  if (selectedCount === 0) return null;

  const handleSelect = async (status: ConversationStatus) => {
    setOpen(false);
    if (!onStatusChange) return;
    await onStatusChange(status);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={updating || !onStatusChange}
        onClick={() => setOpen((value) => !value)}
        className="flex h-7 items-center rounded-full bg-[#25374F] px-2.5 text-[11px] font-bold text-white disabled:opacity-60"
      >
        Status
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-20 mb-2 min-w-[160px] rounded-lg border border-[#E6EAF0] bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => void handleSelect("pending")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#2C405A] hover:bg-[#F4F6FB]"
          >
            <Clock size={14} className="text-[#1972F5]" />
            Mark pending
          </button>
          <button
            type="button"
            onClick={() => void handleSelect("resolved")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#2C405A] hover:bg-[#F4F6FB]"
          >
            <CheckCircle2 size={14} className="text-[#40B630]" />
            Mark resolved
          </button>
        </div>
      )}
    </div>
  );
}
