import type { Metadata } from "next";
import MarketingHome from "@/components/marketing/MarketingHome";
import { marketingMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = marketingMetadata();

export default function MarketingPage() {
  return <MarketingHome />;
}
