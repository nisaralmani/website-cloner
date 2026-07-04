export type CampaignType = "automated" | "one-shot";
export type CampaignStatus = "draft" | "scheduled" | "sent" | "paused";

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  contactCount: number;
  lastUpdate: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  category: "bybelt" | "yours";
}

export interface CampaignCounts {
  templatesAll: number;
  templatesBybelt: number;
  templatesYours: number;
}
