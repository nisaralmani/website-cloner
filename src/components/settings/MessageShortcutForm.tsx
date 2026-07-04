"use client";

import { ChevronDown } from "lucide-react";

type MessageShortcutFieldsProps = {
  bang: string;
  tag: string;
  tags: string[];
  saving?: boolean;
  onBangChange: (value: string) => void;
  onTagChange: (value: string) => void;
};

export function MessageShortcutFields({
  bang,
  tag,
  tags,
  saving,
  onBangChange,
  onTagChange,
}: MessageShortcutFieldsProps) {
  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <label className="mb-1.5 block text-sm font-bold text-[#606976]">
          Shortcut
          <span className="text-[#606976]"> *</span>
        </label>
        <div className="flex h-10 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9]">
          <input
            value={bang}
            disabled={saving}
            placeholder="!bang"
            onChange={(event) => onBangChange(event.target.value)}
            className="h-full w-full rounded border-0 bg-transparent px-3 text-sm font-normal text-[#1c293b] outline-none placeholder:text-[#828ea1]"
          />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <label className="mb-1.5 block text-sm font-bold text-[#606976]">In tag</label>
        <div className="relative">
          <input
            list="message-shortcut-tags"
            value={tag}
            disabled={saving}
            placeholder="—"
            onChange={(event) => onTagChange(event.target.value)}
            className="flex h-10 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm text-[#1c293b] outline-none placeholder:text-[#828ea1]"
          />
          <datalist id="message-shortcut-tags">
            {tags.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#828ea1]"
          />
        </div>
      </div>
    </div>
  );
}
