import type { CampaignTemplate } from "@/types/campaigns";

/** Live FashionSis workspace ships with Bybelt templates but no campaigns yet. */
export const mockCampaigns: never[] = [];

export const mockCampaignTemplates: CampaignTemplate[] = [
  { id: "ct-1", name: "Welcome new visitors", category: "bybelt" },
  { id: "ct-2", name: "Re-engage inactive contacts", category: "bybelt" },
];
