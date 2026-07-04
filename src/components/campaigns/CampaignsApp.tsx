"use client";

import { usePathname } from "next/navigation";
import { isCampaignsTemplatesPath } from "@/lib/campaigns-routes";
import CampaignsPanel from "@/components/campaigns/CampaignsPanel";
import CampaignTemplatesPanel from "@/components/campaigns/CampaignTemplatesPanel";

export default function CampaignsApp() {
  const pathname = usePathname();

  if (isCampaignsTemplatesPath(pathname)) {
    return <CampaignTemplatesPanel />;
  }

  return <CampaignsPanel />;
}
