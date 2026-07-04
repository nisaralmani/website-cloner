import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingAgenticSteps from "@/components/marketing/MarketingAgenticSteps";
import MarketingTestimonials from "@/components/marketing/MarketingTestimonials";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";
import { MarketingPageHero } from "@/components/marketing/marketing-ui";
import { MARKETING_PAGE_BY_SLUG } from "@/lib/marketing-pages";
import { marketingFeaturePath, marketingSignupPath } from "@/lib/marketing-paths";

const page = MARKETING_PAGE_BY_SLUG["ai-agent"];
const TRIAL_NOTE = "14-day free trial · All Bybelt features · No card required";

export default function MarketingAiAgentPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow="AI Agent"
        title={page.h1}
        subtitle={page.subtitle}
        primaryCta={{ label: "Create my AI Agent", href: marketingSignupPath() }}
        secondaryCta={{ label: "View pricing", href: marketingFeaturePath("/pricing") }}
        trialNote={TRIAL_NOTE}
        image={{
          src: "/images/marketing/platform/ai-preview.webp",
          alt: "Bybelt AI Agent workflow preview",
        }}
      />
      <MarketingAgenticSteps />
      <MarketingTestimonials />
      <MarketingHomeCta />
    </MarketingShell>
  );
}
