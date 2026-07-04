"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AGENT_STEPS } from "@/lib/marketing-data";
import { marketingFeaturePath, marketingSignupPath } from "@/lib/marketing-paths";
import MarketingVideoPreview from "@/components/marketing/MarketingVideoPreview";
import {
  MarketingPrimaryButton,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-ui";

export default function MarketingAgenticSteps() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = AGENT_STEPS[activeIndex];

  if (!activeStep) return null;

  return (
    <MarketingSection variant="muted">
      <Link
        href={marketingFeaturePath("/pricing")}
        className="mb-4 inline-block text-sm font-semibold text-[#1972F5] hover:underline"
      >
        Included in the Bybelt Plus plan →
      </Link>
      <MarketingSectionHeader title="Build your perfect AI Agent in 4 steps" />

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        <ol className="space-y-1">
          {AGENT_STEPS.map((step, index) => {
            const active = index === activeIndex;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "w-full rounded-xl px-5 py-4 text-left transition-all",
                    active ? "border border-[#E2E8F0] bg-white shadow-sm" : "hover:bg-white/70",
                  )}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-[#1972F5]">{step.step}</p>
                  <h3 className="mt-1 text-base font-semibold text-[#0f172a]">{step.title}</h3>
                  {active ? (
                    <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{step.description}</p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
        <MarketingVideoPreview poster={activeStep.poster} alt={activeStep.title} />
      </div>

      <div className="mt-10">
        <MarketingPrimaryButton href={marketingSignupPath()}>Create my AI Agent now</MarketingPrimaryButton>
      </div>
    </MarketingSection>
  );
}
