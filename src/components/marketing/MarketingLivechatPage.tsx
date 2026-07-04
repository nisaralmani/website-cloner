"use client";

import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingShowcaseTabs from "@/components/marketing/MarketingShowcaseTabs";
import MarketingTestimonials from "@/components/marketing/MarketingTestimonials";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";
import {
  MarketingFeatureCard,
  MarketingPageHero,
  MarketingPillRow,
  MarketingPrimaryButton,
  MarketingSection,
  MarketingSectionHeader,
  MarketingSecondaryButton,
} from "@/components/marketing/marketing-ui";
import {
  LIVECHAT_BENEFITS,
  LIVECHAT_BUILDERS,
  LIVECHAT_CUSTOMIZE,
  LIVECHAT_ENGAGE,
  LIVECHAT_HERO,
  LIVECHAT_QUALITIES,
  LIVECHAT_RICH_FEATURES,
} from "@/lib/marketing-livechat-data";
import { marketingFeaturePath, marketingSignupPath } from "@/lib/marketing-paths";

export default function MarketingLivechatPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="Live Chat"
        title={LIVECHAT_HERO.h1}
        subtitle={LIVECHAT_HERO.subtitle}
        primaryCta={{ label: "Get started free", href: marketingSignupPath() }}
        secondaryCta={{ label: "Explore features", href: "#benefits" }}
        trialNote={LIVECHAT_HERO.trialNote}
        image={{
          src: "/images/marketing/livechat/hero-widget.webp",
          alt: "Bybelt website chat widget",
        }}
      />

      <MarketingShowcaseTabs
        id="benefits"
        eyebrow="Benefits"
        title="Open the doors, we handle the flow"
        items={LIVECHAT_BENEFITS}
      />

      <MarketingSection variant="white">
        <div className="relative overflow-hidden rounded-2xl bg-[#060d1a] px-8 py-10 text-white md:px-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,rgba(25,114,245,0.35),transparent)]"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#60A5FA]">AI Agent</p>
              <h2 className="mt-2 text-2xl font-medium leading-snug md:text-[1.75rem]">
                Automate replies with Bybelt AI
              </h2>
              <p className="mt-3 text-base text-white/60">
                Resolve tickets faster, reduce workload, and serve customers around the clock with
                AI agents trained on your content.
              </p>
            </div>
            <MarketingSecondaryButton href={marketingFeaturePath("/ai-agent")} dark>
              Explore AI Agent
            </MarketingSecondaryButton>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="muted">
        <MarketingSectionHeader
          eyebrow="Setup"
          title="Easy to implement on any website"
          description="Install Bybelt on your site in under 3 minutes — no developer required."
        />
        <div className="mt-8">
          <MarketingPillRow items={LIVECHAT_BUILDERS} />
        </div>
      </MarketingSection>

      <MarketingShowcaseTabs
        eyebrow="Customization"
        title="Endless chat customization possibilities"
        items={LIVECHAT_CUSTOMIZE}
        variant="white"
      />

      <MarketingSection variant="muted">
        <MarketingSectionHeader title="Have richer conversations" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LIVECHAT_RICH_FEATURES.map((f) => (
            <MarketingFeatureCard key={f.title} title={f.title} description={f.description} />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection variant="white">
        <MarketingSectionHeader title="Send impactful, meaningful messages" />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {LIVECHAT_ENGAGE.map((item) => (
            <MarketingFeatureCard key={item.title} title={item.title} description={item.description} />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection variant="muted">
        <MarketingSectionHeader title="Built for efficiency and personalization" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LIVECHAT_QUALITIES.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-5"
            >
              <h3 className="font-semibold text-[#1972F5]">{item.title}</h3>
              <p className="mt-2 text-sm text-[#64748b]">{item.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <MarketingPrimaryButton href={marketingSignupPath()}>Get started free</MarketingPrimaryButton>
        </div>
      </MarketingSection>

      <MarketingTestimonials />
      <MarketingHomeCta />
    </MarketingShell>
  );
}
