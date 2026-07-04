"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/marketing-ui";

export type ShowcaseTab = {
  id: string;
  title: string;
  description: string;
  image: string;
};

export default function MarketingShowcaseTabs({
  id,
  eyebrow,
  title,
  description,
  items,
  variant = "muted",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  items: readonly ShowcaseTab[];
  variant?: "white" | "muted";
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];

  if (!active) return null;

  return (
    <MarketingSection id={id} variant={variant}>
      <MarketingSectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        <ol className="space-y-1">
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "w-full rounded-xl px-5 py-4 text-left transition-all",
                    isActive
                      ? "border border-[#E2E8F0] bg-white shadow-sm"
                      : "hover:bg-white/70",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      isActive ? "text-[#1972F5]" : "text-[#94A3B8]",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-1 text-base font-semibold text-[#0f172a]">{item.title}</p>
                  {isActive ? (
                    <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{item.description}</p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
          <Image
            src={active.image}
            alt={active.title}
            width={720}
            height={480}
            className="h-auto w-full rounded-xl"
          />
        </div>
      </div>
    </MarketingSection>
  );
}
