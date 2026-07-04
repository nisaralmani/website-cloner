import { MarketingPageHero } from "@/components/marketing/marketing-ui";
import type { MarketingPageDefinition } from "@/lib/marketing-pages";
import { appLoginUrl, marketingSignupPath } from "@/lib/marketing-paths";

const TRIAL_NOTE = "14-day free trial · All Bybelt features · No card required";

export default function MarketingSubPageHero({
  page,
  ctaLabel = "Start free trial",
  ctaHref = marketingSignupPath(),
  ctaExternal = false,
}: {
  page: MarketingPageDefinition;
  ctaLabel?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
}) {
  return (
    <MarketingPageHero
      title={page.h1}
      subtitle={page.subtitle}
      centered
      primaryCta={{ label: ctaLabel, href: ctaHref, external: ctaExternal }}
      secondaryCta={{ label: "Log in", href: appLoginUrl(), external: true }}
      trialNote={page.slug === "signup" ? undefined : TRIAL_NOTE}
    />
  );
}
