"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export default function MarketingVideoModal({
  open,
  onClose,
  title,
  poster,
  alt,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  poster: string;
  alt: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close video"
        className="absolute inset-0 bg-[#19253B]/80"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-[960px] overflow-hidden rounded-2xl bg-[#19253B] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <p className="text-base font-semibold text-white">{title}</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="relative aspect-video bg-black">
          <Image src={poster} alt={alt} fill className="object-cover opacity-90" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/35 px-6 text-center">
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              Video preview
            </span>
            <p className="max-w-md text-sm text-white/90">
              Product overview video — static clone (no live stream).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
