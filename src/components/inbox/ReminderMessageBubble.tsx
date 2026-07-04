"use client";

import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/inbox";
import { PersonGlyph } from "@/components/icons";
import { formatReminderDueLabel } from "@/lib/inbox/reminders";

export function ReminderMessageBubble({
  message,
  cancelling,
  onCancel,
}: {
  message: Message;
  cancelling?: boolean;
  onCancel?: (reminderId: string) => Promise<unknown>;
}) {
  const canCancel = Boolean(message.reminderId && message.remindAt && onCancel);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="group relative max-w-[85%] rounded-lg border border-[#C4B5FD] bg-[#EDE9FE] px-4 py-2.5 text-sm text-[#2C405A]">
        {canCancel && (
          <button
            type="button"
            aria-label="Cancel reminder"
            disabled={cancelling}
            onClick={() => message.reminderId && void onCancel?.(message.reminderId)}
            className="absolute right-2 top-2 rounded p-1 text-[#6D28D9] opacity-0 transition-opacity hover:bg-[#C4B5FD]/40 disabled:opacity-40 group-hover:opacity-100"
          >
            <X size={14} />
          </button>
        )}
        <div className="mb-1 flex items-center gap-2 pr-8">
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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#6D28D9]">
            <Bell size={12} />
            Reminder{message.author ? ` · ${message.author.name}` : ""}
          </span>
        </div>
        <p>{message.text}</p>
        <p className="mt-2 text-xs font-semibold text-[#6D28D9]">
          {message.remindAt
            ? `Due ${formatReminderDueLabel(message.remindAt)}`
            : "Cancelled"}
        </p>
      </div>
      <span className="text-[11px] text-[#828EA1]">{message.time}</span>
    </div>
  );
}
