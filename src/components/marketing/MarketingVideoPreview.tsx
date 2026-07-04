"use client";

import { useState } from "react";
import Image from "next/image";
import MarketingVideoModal from "@/components/marketing/MarketingVideoModal";

export default function MarketingVideoPreview({
  poster,
  alt,
  className = "",
}: {
  poster: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl bg-[#E8EAEB] shadow-[0_20px_60px_rgba(25,37,59,0.12)] ${className}`}
      >
        <Image
          src={poster}
          alt={alt}
          width={1200}
          height={720}
          className="h-auto w-full object-cover"
        />
        <button
          type="button"
          aria-label="Play video"
          onClick={() => setOpen(true)}
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform hover:scale-105"
        >
          <Image
            src="/images/marketing/play-icon.svg"
            alt=""
            width={26}
            height={26}
            aria-hidden
          />
        </button>
      </div>
      <MarketingVideoModal
        open={open}
        onClose={() => setOpen(false)}
        title={alt}
        poster={poster}
        alt={alt}
      />
    </>
  );
}
