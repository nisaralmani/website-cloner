import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { campaignRecipients, campaigns } from "@/db/schema";
import { toCampaign } from "@/lib/campaigns/mappers";
import type { CampaignStatus } from "@/types/campaigns";

const VALID_STATUSES = new Set<CampaignStatus>(["draft", "scheduled", "sent", "paused"]);

export async function updateCampaign(
  db: AppDatabase,
  workspaceId: string,
  campaignId: string,
  input: { name?: string; status?: CampaignStatus },
) {
  const existing = await selectOne(
    db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId)),
  );

  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const updates: { name?: string; status?: string; lastUpdate: string } = {
    lastUpdate: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date()),
  };

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      return { ok: false as const, error: "name is required" };
    }
    updates.name = name;
  }

  if (input.status !== undefined) {
    if (!VALID_STATUSES.has(input.status)) {
      return { ok: false as const, error: "status is invalid" };
    }
    updates.status = input.status;
  }

  await db.update(campaigns).set(updates).where(eq(campaigns.id, campaignId));

  const row = await selectOne(db.select().from(campaigns).where(eq(campaigns.id, campaignId)));
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, campaign: toCampaign(row) };
}

export async function deleteCampaign(db: AppDatabase, workspaceId: string, campaignId: string) {
  const existing = await selectOne(
    db.select({ id: campaigns.id, workspaceId: campaigns.workspaceId }).from(campaigns).where(eq(campaigns.id, campaignId)),
  );

  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await db.delete(campaignRecipients).where(eq(campaignRecipients.campaignId, campaignId));
  await db.delete(campaigns).where(eq(campaigns.id, campaignId));
  return { ok: true as const, id: campaignId };
}
