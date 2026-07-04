import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { campaigns } from "@/db/schema";
import { toCampaign } from "@/lib/campaigns/mappers";
import { listCampaignRecipients } from "@/lib/campaigns/recipients";
import { sendEmail } from "@/lib/email/send-email";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";

export async function sendCampaign(db: AppDatabase, workspaceId: string, campaignId: string) {
  const existing = await selectOne(
    db.select().from(campaigns).where(eq(campaigns.id, campaignId)),
  );

  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (existing.status !== "draft") {
    return { ok: false as const, error: "Only draft campaigns can be sent" };
  }

  if (existing.contactCount <= 0) {
    return { ok: false as const, error: "Campaign must have at least one recipient" };
  }

  const recipientsResult = await listCampaignRecipients(db, workspaceId, campaignId);
  if (!recipientsResult.ok) {
    return { ok: false as const, reason: "not_found" as const };
  }

  let emailsDispatched = 0;
  for (const recipient of recipientsResult.recipients) {
    if (!recipient.email?.trim()) {
      continue;
    }

    const result = await sendEmail({
      to: recipient.email,
      subject: existing.name,
      text: `You are receiving the campaign "${existing.name}" from our team.`,
      workspaceId,
    });

    if (result.ok) {
      emailsDispatched += 1;
    }
  }

  const lastUpdate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  await db
    .update(campaigns)
    .set({ status: "sent", lastUpdate })
    .where(eq(campaigns.id, campaignId));

  await deliverWorkspaceWebhooks(db, workspaceId, "campaign:sent", {
    campaignId,
    name: existing.name,
    recipientCount: recipientsResult.recipients.length,
    emailsDispatched,
  });

  const row = await selectOne(db.select().from(campaigns).where(eq(campaigns.id, campaignId)));
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return {
    ok: true as const,
    campaign: toCampaign(row),
    emailsDispatched,
  };
}
