import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingAgenticSteps from "@/components/marketing/MarketingAgenticSteps";
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
  HUGO_BENEFITS,
  HUGO_CHANNELS,
  HUGO_HERO,
  HUGO_USE_CASES,
} from "@/lib/marketing-hugo-data";
import { marketingFeaturePath, marketingSignupPath } from "@/lib/marketing-paths";

export default function MarketingHugoPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="AI Agent · Hugo"
        title={HUGO_HERO.h1}
        subtitle={HUGO_HERO.subtitle}
        primaryCta={{ label: "Get your AI Agent", href: marketingSignupPath() }}
        secondaryCta={{ label: "See how it works", href: marketingFeaturePath("/ai-agent") }}
        trialNote={HUGO_HERO.trialNote}
        image={{
          src: "/images/marketing/platform/ai-preview.webp",
          alt: "Hugo AI agent interface preview",
        }}
      />

      <MarketingSection variant="white">
        <MarketingSectionHeader
          eyebrow="Capabilities"
          title="The AI teammate built for modern support teams"
          description="Hugo is included in the Bybelt Plus plan and works alongside your shared inbox, knowledge base, and CRM — not instead of them."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HUGO_BENEFITS.map((item) => (
            <MarketingFeatureCard key={item.title} title={item.title} description={item.description} />
          ))}
        </div>
      </MarketingSection>

      <MarketingAgenticSteps />

      <MarketingSection variant="muted">
        <MarketingSectionHeader title="Deploy Hugo on every channel your customers use" />
        <div className="mt-8">
          <MarketingPillRow items={HUGO_CHANNELS} />
        </div>
        <Link
          href={marketingFeaturePath("/livechat")}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1972F5] hover:underline"
        >
          See all messaging channels →
        </Link>
      </MarketingSection>

      <MarketingSection variant="white">
        <MarketingSectionHeader title="Built for every team that talks to customers" />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {HUGO_USE_CASES.map((item) => (
            <MarketingFeatureCard key={item.title} title={item.title} description={item.description} />
          ))}
        </div>
      </MarketingSection>

      <MarketingTestimonials />
      <MarketingHomeCta />
    </MarketingShell>
  );
}
