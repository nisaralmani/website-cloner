"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/inbox";
import { PersonGlyph } from "@/components/icons";

function isShopifyIntegrationNote(text: string): boolean {
  return (
    text.includes("Shopify order") ||
    text.includes("Shopify refund") ||
    text.includes("🛒") ||
    text.includes("↩️") ||
    text.includes("📬") ||
    text.includes("💳") ||
    text.includes("❌") ||
    text.includes("📦")
  );
}

export function NoteMessageBubble({
  message,
  deleting,
  updating,
  onDelete,
  onUpdate,
}: {
  message: Message;
  deleting?: boolean;
  updating?: boolean;
  onDelete?: (messageId: string) => Promise<unknown>;
  onUpdate?: (messageId: string, text: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const busy = deleting || updating;
  const shopifyNote = isShopifyIntegrationNote(message.text);

  const beginEditing = () => {
    setDraft(message.text);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(message.text);
    setEditing(false);
  };

  const saveEditing = async () => {
    if (!onUpdate || busy) return;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.text) {
      cancelEditing();
      return;
    }

    const saved = await onUpdate(message.id, trimmed);
    if (saved) {
      setEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "group relative max-w-[85%] rounded-lg border px-4 py-2.5 text-sm text-[#2C405A]",
          shopifyNote
            ? "border-[#5DAC5D] bg-[#F2F8F2]"
            : "border-[#FACA00] bg-[#FFF5CC]",
        )}
      >
        {!editing && (onDelete || onUpdate) && (
          <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {onUpdate && (
              <button
                type="button"
                aria-label="Edit note"
                disabled={busy}
                onClick={beginEditing}
                className={cn(
                  "rounded p-1 hover:bg-black/5 disabled:opacity-40",
                  shopifyNote ? "text-[#5DAC5D]" : "text-[#9A7B00] hover:bg-[#FACA00]/40",
                )}
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                aria-label="Delete note"
                disabled={busy}
                onClick={() => void onDelete(message.id)}
                className={cn(
                  "rounded p-1 hover:bg-black/5 disabled:opacity-40",
                  shopifyNote ? "text-[#5DAC5D]" : "text-[#9A7B00] hover:bg-[#FACA00]/40",
                )}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
        <div className="mb-1 flex items-center gap-2 pr-10">
          {message.author && (
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white",
                message.author.avatarGradient,
              )}
              title={message.author.name}
            >
              <PersonGlyph size={12} />
            </div>
          )}
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-wide",
              shopifyNote ? "text-[#5DAC5D]" : "text-[#9A7B00]",
            )}
          >
            Note{message.author ? ` · ${message.author.name}` : ""}
          </span>
        </div>
        {editing ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void saveEditing();
            }}
          >
            <textarea
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={busy}
              className="w-full resize-none rounded-md border border-[#FACA00] bg-white px-3 py-2 text-sm text-[#2C405A] outline-none focus:border-[#9A7B00] disabled:opacity-60"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="text-sm font-semibold text-[#9A7B00] disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={cancelEditing}
                className="text-sm text-[#828EA1] disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          message.text
        )}
      </div>
      <span className="text-[11px] text-[#828EA1]">{message.time}</span>
    </div>
  );
}
