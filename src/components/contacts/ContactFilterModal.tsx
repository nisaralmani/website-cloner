"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ContactSegment } from "@/types/contacts";

type ContactFilterModalProps = {
  open: boolean;
  initialSegment: "" | ContactSegment;
  initialQuery: string;
  onClose: () => void;
  onSave: (input: { name: string; segment: "" | ContactSegment; query: string }) => void;
};

export function ContactFilterModal({
  open,
  initialSegment,
  initialQuery,
  onClose,
  onSave,
}: ContactFilterModalProps) {
  const [name, setName] = useState("");
  const [segment, setSegment] = useState<"" | ContactSegment>(initialSegment);
  const [query, setQuery] = useState(initialQuery);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F4F4F5] px-5 py-4">
          <h2 className="text-base font-semibold text-[#1C293B]">Save contact filter</h2>
          <button type="button" onClick={onClose} className="text-[#828EA1]" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <label className="block text-sm font-semibold text-[#1C293B]">
            Filter name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded border border-[#E8EAEB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-sm font-semibold text-[#1C293B]">
            Segment
            <select
              value={segment}
              onChange={(event) =>
                setSegment(event.target.value as "" | ContactSegment)
              }
              className="mt-1 w-full rounded border border-[#E8EAEB] px-3 py-2 text-sm font-normal"
            >
              <option value="">All segments</option>
              <option value="chat">chat</option>
              <option value="shopify">shopify</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#1C293B]">
            Search query
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Optional"
              className="mt-1 w-full rounded border border-[#E8EAEB] px-3 py-2 text-sm font-normal"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#F4F4F5] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#E8EAEB] px-4 py-2 text-sm font-semibold text-[#5D6B98]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => {
              onSave({ name: name.trim(), segment, query });
              setName("");
              onClose();
            }}
            className="rounded bg-[#1972F5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Save filter
          </button>
        </div>
      </div>
    </div>
  );
}
