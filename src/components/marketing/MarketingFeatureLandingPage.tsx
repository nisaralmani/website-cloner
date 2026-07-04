"use client";

import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingShowcaseTabs from "@/components/marketing/MarketingShowcaseTabs";
import MarketingTestimonials from "@/components/marketing/MarketingTestimonials";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";
import {
  MarketingFeatureCard,
  MarketingPageHero,
  MarketingPillRow,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-ui";
import {
  FEATURE_LANDING_CONFIG,
  type FeatureLandingSlug,
} from "@/lib/marketing-feature-landings";
import type { MarketingPageDefinition } from "@/lib/marketing-pages";
import { marketingFeaturePath, marketingSignupPath } from "@/lib/marketing-paths";

const TRIAL_NOTE = "14-day free trial · All Bybelt features · No card required";

export default function MarketingFeatureLandingPage({
  page,
}: {
  page: MarketingPageDefinition;
}) {
  const config = FEATURE_LANDING_CONFIG[page.slug as FeatureLandingSlug];
  const isUnleash = page.slug === "unleash";

  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow={config.eyebrow}
        title={page.h1}
        subtitle={page.subtitle}
        primaryCta={
          isUnleash
            ? { label: "Open Unleash", href: marketingFeaturePath("/unleash") }
            : { label: "Get started free", href: marketingSignupPath() }
        }
        secondaryCta={
          !isUnleash && config.showcase.length > 0
            ? { label: "Explore features", href: "#showcase" }
            : undefined
        }
        trialNote={isUnleash ? undefined : TRIAL_NOTE}
        image={{
          src: config.heroImage,
          alt: config.heroImageAlt,
        }}
      />

      {config.showcase.length > 0 ? (
        <MarketingShowcaseTabs
          id="showcase"
          title={config.showcaseTitle}
          items={config.showcase}
        />
      ) : (
        <MarketingSection variant="muted">
          <MarketingSectionHeader title={config.showcaseTitle} description={page.subtitle} align="center" />
        </MarketingSection>
      )}

      <MarketingSection variant="white">
        {config.pills ? (
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            <MarketingPillRow items={config.pills} />
          </div>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {config.highlights.map((item) => (
            <MarketingFeatureCard key={item.title} title={item.title} description={item.description} />
          ))}
        </div>
        {!isUnleash ? (
          <div className="mt-12 text-center">
            <Link
              href={marketingSignupPath()}
              className="inline-flex h-12 items-center rounded-full bg-[#1972F5] px-8 text-[15px] font-medium text-white hover:bg-[#1565DB]"
            >
              Start free trial
            </Link>
          </div>
        ) : null}
      </MarketingSection>

      {!isUnleash ? (
        <>
          <MarketingTestimonials />
          <MarketingHomeCta />
        </>
      ) : null}
    </MarketingShell>
  );
}
