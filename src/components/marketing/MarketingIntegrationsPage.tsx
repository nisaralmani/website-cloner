import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";
import {
  MarketingFeatureCard,
  MarketingPageHero,
  MarketingPillRow,
  MarketingPrimaryButton,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-ui";
import { PUBLIC_DOCS_URL } from "@/lib/docs-links";
import { marketingSignupPath, appPluginsUrl } from "@/lib/marketing-paths";
import {
  INTEGRATIONS_CATEGORIES,
  INTEGRATIONS_FEATURED,
  INTEGRATIONS_HERO,
} from "@/lib/marketing-integrations-data";

export default function MarketingIntegrationsPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="Integrations"
        title={INTEGRATIONS_HERO.h1}
        subtitle={INTEGRATIONS_HERO.subtitle}
        primaryCta={{ label: "Open Developer Hub", href: PUBLIC_DOCS_URL, external: true }}
        secondaryCta={{ label: "Start free trial", href: marketingSignupPath() }}
        image={{
          src: "/images/marketing/integrations/hero-illustration.svg",
          alt: "Bybelt integrations illustration",
          width: 420,
          height: 360,
          className: "relative h-auto w-full max-w-[420px]",
        }}
      />

      <MarketingSection variant="white" className="!pt-4">
        <MarketingPillRow items={INTEGRATIONS_CATEGORIES} />
      </MarketingSection>

      <MarketingSection variant="muted">
        <MarketingSectionHeader
          eyebrow="Marketplace"
          title="Popular integrations"
          description="Connect your favorite tools to Bybelt in a few clicks."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS_FEATURED.map((integration) => (
            <MarketingFeatureCard
              key={integration.name}
              title={integration.name}
              description={integration.summary}
            />
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-[#94A3B8]">
          100+ integrations available in the Bybelt marketplace
        </p>
        <div className="mt-8 text-center">
          <MarketingPrimaryButton href={appPluginsUrl()} external>
            Browse all plugins
          </MarketingPrimaryButton>
        </div>
      </MarketingSection>

      <MarketingHomeCta />
    </MarketingShell>
  );
}
