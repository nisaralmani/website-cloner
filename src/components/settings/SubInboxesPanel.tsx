"use client";

import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubInbox } from "@/types/sub-inboxes";

type SubInboxesPanelProps = {
  subInboxes: SubInbox[];
  saving?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onDelete: (id: string) => Promise<boolean>;
  onToggle: (id: string, enabled: boolean) => Promise<boolean>;
  onUpdate: (
    id: string,
    patch: { name?: string; segment?: string | null },
  ) => Promise<boolean>;
};

export function SubInboxesPanel({
  subInboxes,
  saving,
  emptyTitle,
  emptyDescription,
  onDelete,
  onToggle,
  onUpdate,
}: SubInboxesPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSegment, setEditSegment] = useState("");

  if (subInboxes.length === 0) {
    return (
      <div className="flex flex-col items-center rounded border border-[#E8EAEB] px-2.5 py-3.5 text-center">
        <Eye size={20} className="mb-2 text-[#1c293b]" strokeWidth={1.75} />
        <p className="text-sm font-medium text-[#1c293b]">{emptyTitle}</p>
        <p className="mt-1 text-sm text-[#75869c]">{emptyDescription}</p>
      </div>
    );
  }

  const startEdit = (subInbox: SubInbox) => {
    setEditingId(subInbox.id);
    setEditName(subInbox.name);
    setEditSegment(subInbox.segment ?? "");
  };

  const saveEdit = async (id: string) => {
    const ok = await onUpdate(id, {
      name: editName.trim(),
      segment: editSegment.trim() || null,
    });
    if (ok) setEditingId(null);
  };

  return (
    <ul className="rounded border border-[#E8EAEB]">
      {subInboxes.map((subInbox) => (
        <li
          key={subInbox.id}
          className="flex items-start justify-between gap-4 border-b border-[#E8EAEB] px-3 py-3 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            {editingId === subInbox.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="w-full rounded border border-[#E8EAEB] px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  value={editSegment}
                  onChange={(event) => setEditSegment(event.target.value)}
                  placeholder="Segment (optional)"
                  className="w-full rounded border border-[#E8EAEB] px-2 py-1 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving || !editName.trim()}
                    onClick={() => void saveEdit(subInbox.id)}
                    className="text-xs font-bold text-[#1972F5] disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-xs font-semibold text-[#75869c]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => startEdit(subInbox)}
                  className="text-left text-sm font-bold text-[#1c293b] hover:text-[#1972F5]"
                >
                  {subInbox.name}
                </button>
                {subInbox.segment ? (
                  <p className="mt-1 text-sm text-[#75869c]">Segment: {subInbox.segment}</p>
                ) : null}
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={subInbox.enabled}
              disabled={saving}
              onClick={() => void onToggle(subInbox.id, !subInbox.enabled)}
              className={cn(
                "relative h-6 w-[42px] rounded-[20px] transition-colors",
                subInbox.enabled ? "bg-[#1972F5]" : "bg-[#F4F4F5]",
                saving && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full transition-all",
                  subInbox.enabled ? "left-[22px] bg-white" : "left-1 bg-[#bbbfc4]",
                )}
              />
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onDelete(subInbox.id)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded border border-[#E8EAEB] text-[#606976]",
                saving && "opacity-60",
              )}
              aria-label={`Delete ${subInbox.name}`}
            >
              <Trash2 size={15} strokeWidth={1.75} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
