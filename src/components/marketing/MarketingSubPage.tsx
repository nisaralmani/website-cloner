import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingSubPageHero from "@/components/marketing/MarketingSubPageHero";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";
import type { MarketingPageDefinition } from "@/lib/marketing-pages";
import { appLoginUrl, marketingSignupPath } from "@/lib/marketing-paths";

export default function MarketingSubPage({
  page,
}: {
  page: MarketingPageDefinition;
}) {
  const ctaLabel = page.slug === "signup" ? "Create my account" : "Start free trial";
  const ctaHref = page.slug === "signup" ? appLoginUrl() : marketingSignupPath();

  return (
    <MarketingShell>
      <MarketingSubPageHero
        page={page}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
        ctaExternal={page.slug === "signup"}
      />
      <MarketingHomeCta />
    </MarketingShell>
  );
}
