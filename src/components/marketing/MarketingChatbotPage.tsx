"use client";

import Image from "next/image";
import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingShowcaseTabs from "@/components/marketing/MarketingShowcaseTabs";
import MarketingTestimonials from "@/components/marketing/MarketingTestimonials";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";
import {
  MarketingPageHero,
  MarketingPillRow,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-ui";
import {
  CHATBOT_BUILDER_SCENARIOS,
  CHATBOT_ENGAGE,
  CHATBOT_HERO,
  CHATBOT_SHOWCASE,
  CHATBOT_TRAIN_SOURCES,
} from "@/lib/marketing-chatbot-data";
import { marketingFeaturePath, marketingSignupPath } from "@/lib/marketing-paths";

export default function MarketingChatbotPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow={CHATBOT_HERO.eyebrow}
        title={CHATBOT_HERO.h1}
        subtitle={CHATBOT_HERO.subtitle}
        primaryCta={{ label: "Build my chatbot", href: marketingSignupPath() }}
        secondaryCta={{ label: "Meet AI Agent", href: marketingFeaturePath("/ai-agent") }}
        trialNote={CHATBOT_HERO.trialNote}
        image={{
          src: "/images/marketing/chatbot/hero-widget.webp",
          alt: "Bybelt AI chatbot widget",
          className: "relative h-auto w-full max-w-[420px] rounded-2xl",
        }}
      />

      <MarketingShowcaseTabs
        eyebrow="Automation"
        title="Automate support without losing the human touch"
        items={CHATBOT_SHOWCASE}
      />

      <MarketingSection variant="white">
        <div className="grid gap-6 lg:grid-cols-2">
          {CHATBOT_ENGAGE.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"
            >
              <Image src={item.image} alt={item.title} width={560} height={320} className="h-auto w-full" />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[#0f172a]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection variant="muted">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <MarketingSectionHeader
              eyebrow="Training"
              title="Train your chatbot on content you already have"
            />
            <div className="mt-6">
              <MarketingPillRow items={CHATBOT_TRAIN_SOURCES} />
            </div>
            <h3 className="mt-10 text-lg font-semibold text-[#0f172a]">No-code builder scenarios</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {CHATBOT_BUILDER_SCENARIOS.map((s) => (
                <span key={s} className="rounded-lg bg-white px-3 py-2 text-sm text-[#64748b]">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <Image
            src="/images/marketing/chatbot/train-website.webp"
            alt="Train chatbot from website content"
            width={560}
            height={420}
            className="h-auto w-full rounded-2xl border border-[#E2E8F0] bg-white"
          />
        </div>
      </MarketingSection>

      <MarketingTestimonials />
      <MarketingHomeCta />
    </MarketingShell>
  );
}
