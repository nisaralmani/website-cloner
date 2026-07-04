import type { Metadata } from "next";
import CampaignsApp from "@/components/campaigns/CampaignsApp";
import { CAMPAIGNS_NAV } from "@/lib/campaigns-routes";
import { APP_CAMPAIGNS_PATH } from "@/lib/marketing-paths";

export const metadata: Metadata = {
  title: "Campaigns | Bybelt",
};

export function generateStaticParams() {
  const slugs = CAMPAIGNS_NAV.flatMap((section) =>
    section.items.map((item) => ({
      slug: item.href.replace(`${APP_CAMPAIGNS_PATH}/`, "").split("/"),
    })),
  );
  return [{ slug: [] }, ...slugs];
}

export default function CampaignsPage() {
  return <CampaignsApp />;
}
