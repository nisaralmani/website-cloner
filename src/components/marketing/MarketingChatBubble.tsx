"use client";

import { useEffect, useId, useState } from "react";
import { MessageCircle, Minus, X } from "lucide-react";
import { BybeltMark } from "@/components/icons";
import { cn } from "@/lib/utils";

const WELCOME_MESSAGE =
  "Hi there! 👋 How can we help you build exceptional customer support today?";

export default function MarketingChatBubble() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Bybelt chat preview"
          className="mb-4 w-[min(376px,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-[#E8EAEB] bg-white shadow-[0_20px_60px_rgba(25,37,59,0.18)]"
        >
          <div className="flex items-center justify-between bg-[#1972F5] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <BybeltMark size={22} />
              <span className="text-sm font-semibold">bybelt</span>
              <span className="truncate text-sm font-medium text-white/80">· Questions?</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Minimize chat"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15"
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="h-[360px] overflow-y-auto bg-[#F4F6FB] p-4">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-[#242F47] shadow-sm">
              {WELCOME_MESSAGE}
            </div>
            <p className="mt-3 text-center text-xs text-[#828EA1]">
              Static preview — connect Bybelt on your live site.
            </p>
          </div>

          <div className="border-t border-[#E8EAEB] bg-white p-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#E8EAEB] bg-[#F9FAFB] px-3 py-2.5">
              <input
                type="text"
                readOnly
                placeholder="Compose your message…"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#242F47] outline-none placeholder:text-[#828EA1]"
                aria-label="Message input (preview only)"
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Close chat widget" : "Open chat widget"}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-[#1972F5] shadow-[0_8px_24px_rgba(25,114,245,0.45)] transition-transform hover:scale-105",
          open && "rotate-0",
        )}
      >
        {open ? (
          <X size={26} className="text-white" strokeWidth={2} />
        ) : (
          <MessageCircle size={28} className="text-white" fill="white" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}
