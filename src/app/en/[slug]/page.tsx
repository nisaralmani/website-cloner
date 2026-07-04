import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingPricingPage from "@/components/marketing/MarketingPricingPage";
import MarketingAiAgentPage from "@/components/marketing/MarketingAiAgentPage";
import MarketingLivechatPage from "@/components/marketing/MarketingLivechatPage";
import MarketingHugoPage from "@/components/marketing/MarketingHugoPage";
import MarketingSharedInboxPage from "@/components/marketing/MarketingSharedInboxPage";
import MarketingChatbotPage from "@/components/marketing/MarketingChatbotPage";
import MarketingIntegrationsPage from "@/components/marketing/MarketingIntegrationsPage";
import MarketingAppsPage from "@/components/marketing/MarketingAppsPage";
import MarketingSignupPage from "@/components/marketing/MarketingSignupPage";
import MarketingFeatureLandingPage from "@/components/marketing/MarketingFeatureLandingPage";
import MarketingSubPage from "@/components/marketing/MarketingSubPage";
import {
  MARKETING_PAGES,
  MARKETING_PAGE_BY_SLUG,
  type MarketingPageSlug,
} from "@/lib/marketing-pages";
import { marketingPageMetadata } from "@/lib/seo-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return MARKETING_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = MARKETING_PAGE_BY_SLUG[slug as MarketingPageSlug];
  if (!page) return {};
  return marketingPageMetadata(page.documentTitle, page.description);
}

export default async function MarketingSubRoutePage({ params }: PageProps) {
  const { slug } = await params;
  const page = MARKETING_PAGE_BY_SLUG[slug as MarketingPageSlug];
  if (!page) notFound();

  switch (page.variant) {
    case "pricing":
      return <MarketingPricingPage />;
    case "ai-agent":
      return <MarketingAiAgentPage />;
    case "livechat":
      return <MarketingLivechatPage />;
    case "hugo":
      return <MarketingHugoPage />;
    case "shared-inbox":
      return <MarketingSharedInboxPage />;
    case "chatbot":
      return <MarketingChatbotPage />;
    case "integrations":
      return <MarketingIntegrationsPage />;
    case "apps":
      return <MarketingAppsPage />;
    case "signup":
      return <MarketingSignupPage />;
    case "feature":
      return <MarketingFeatureLandingPage page={page} />;
    default:
      return <MarketingSubPage page={page} />;
  }
}
