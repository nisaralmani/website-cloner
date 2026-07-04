"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import MarketingVideoModal from "@/components/marketing/MarketingVideoModal";

export default function MarketingPlayVideoButton({
  title,
  subtitle,
  poster,
  posterAlt,
  className = "",
  variant = "light",
  icon,
}: {
  title: string;
  subtitle: string;
  poster: string;
  posterAlt: string;
  className?: string;
  variant?: "light" | "dark";
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isDark = variant === "dark";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-3 text-left transition-opacity hover:opacity-80 ${className}`}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isDark ? "border border-white/15 bg-white/10" : "bg-white shadow-md"
          }`}
        >
          {icon ?? (
            <Image
              src="/images/marketing/play-icon.svg"
              alt=""
              width={36}
              height={36}
              aria-hidden
            />
          )}
        </span>
        <span>
          <span
            className={`block text-sm font-semibold ${isDark ? "text-white" : "text-[#19253B]"}`}
          >
            {title}
          </span>
          <span className={`block text-sm ${isDark ? "text-white/50" : "text-[#5F6D7F]"}`}>
            {subtitle}
          </span>
        </span>
      </button>
      <MarketingVideoModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        poster={poster}
        alt={posterAlt}
      />
    </>
  );
}
