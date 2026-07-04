import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingCustomersStrip from "@/components/marketing/MarketingCustomersStrip";
import MarketingHomeBento from "@/components/marketing/MarketingHomeBento";
import MarketingHomeWorkflow from "@/components/marketing/MarketingHomeWorkflow";
import MarketingTestimonials from "@/components/marketing/MarketingTestimonials";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";

export default function MarketingHome() {
  return (
    <MarketingShell>
      <MarketingHero />
      <MarketingCustomersStrip />
      <MarketingHomeBento />
      <MarketingHomeWorkflow />
      <MarketingTestimonials />
      <MarketingHomeCta />
    </MarketingShell>
  );
}
