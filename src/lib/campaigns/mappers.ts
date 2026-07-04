import type { Campaign, CampaignCounts, CampaignTemplate } from "@/types/campaigns";
import type { campaignTemplates, campaigns } from "@/db/schema";

type CampaignRow = typeof campaigns.$inferSelect;
type TemplateRow = typeof campaignTemplates.$inferSelect;

export function toCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Campaign["type"],
    status: row.status as Campaign["status"],
    contactCount: row.contactCount,
    lastUpdate: row.lastUpdate,
  };
}

export function toCampaignTemplate(row: TemplateRow): CampaignTemplate {
  return {
    id: row.id,
    name: row.name,
    category: row.category as CampaignTemplate["category"],
  };
}

export function toCampaignCounts(rows: TemplateRow[]): CampaignCounts {
  const bybeltCount = rows.filter((row) => row.category === "bybelt").length;
  const yours = rows.filter((row) => row.category === "yours").length;
  return {
    templatesAll: rows.length,
    templatesBybelt: bybeltCount,
    templatesYours: yours,
  };
}
