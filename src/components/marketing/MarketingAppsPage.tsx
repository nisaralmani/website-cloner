import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";
import {
  MarketingFeatureCard,
  MarketingPageHero,
  MarketingPrimaryButton,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-ui";
import { APPS_FEATURES, APPS_HERO, APPS_PLATFORMS } from "@/lib/marketing-apps-data";
import { appLoginUrl, marketingSignupPath } from "@/lib/marketing-paths";
import Image from "next/image";
import Link from "next/link";

export default function MarketingAppsPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="Apps"
        title={APPS_HERO.h1}
        subtitle={APPS_HERO.subtitle}
        centered
        primaryCta={{ label: "Download for desktop", href: appLoginUrl(), external: true }}
        secondaryCta={{ label: "Start free trial", href: marketingSignupPath() }}
      />

      <MarketingSection variant="white" className="!pt-8">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS_PLATFORMS.map((platform) => (
            <li
              key={platform.name}
              className="flex flex-col items-center rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center transition-all hover:border-[#1972F5]/30 hover:shadow-[0_8px_30px_rgba(25,114,245,0.06)]"
            >
              <Image src={platform.image} alt={platform.name} width={56} height={56} className="mb-5" />
              <h2 className="text-lg font-semibold text-[#0f172a]">{platform.name}</h2>
              {platform.external ? (
                <a
                  href={platform.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-5 inline-flex h-10 items-center rounded-full px-5 text-sm font-medium ${
                    platform.primary
                      ? "bg-[#1972F5] text-white hover:bg-[#1565DB]"
                      : "border border-[#E2E8F0] text-[#334155] hover:border-[#1972F5]"
                  }`}
                >
                  {platform.action}
                </a>
              ) : (
                <Link
                  href={platform.href}
                  className={`mt-5 inline-flex h-10 items-center rounded-full px-5 text-sm font-medium ${
                    platform.primary
                      ? "bg-[#1972F5] text-white hover:bg-[#1565DB]"
                      : "border border-[#E2E8F0] text-[#334155] hover:border-[#1972F5]"
                  }`}
                >
                  {platform.action}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection variant="muted">
        <MarketingSectionHeader
          eyebrow="Features"
          title="Support customers from anywhere"
          description="Stay connected to your shared inbox on every device — desktop, mobile, and web."
          align="center"
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {APPS_FEATURES.map((feature) => (
            <MarketingFeatureCard key={feature.title} title={feature.title} description={feature.description} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <MarketingPrimaryButton href={marketingSignupPath()}>Get started free</MarketingPrimaryButton>
        </div>
      </MarketingSection>

      <MarketingHomeCta />
    </MarketingShell>
  );
}
