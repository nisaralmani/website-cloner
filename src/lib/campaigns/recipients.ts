import { and, count, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll, selectOne } from "@/db/client";
import { campaignRecipients, campaigns, contacts } from "@/db/schema";
import { loadStoredWorkspaceData } from "@/lib/workspaces/workspace-data-store";
import { toContact } from "@/lib/contacts/mappers";

export async function syncCampaignContactCount(db: AppDatabase, campaignId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));

  const contactCount = row?.value ?? 0;
  await db.update(campaigns).set({ contactCount }).where(eq(campaigns.id, campaignId));
  return contactCount;
}

export async function addCampaignRecipients(
  db: AppDatabase,
  workspaceId: string,
  campaignId: string,
  contactIds: string[],
) {
  const uniqueIds = [...new Set(contactIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { ok: false as const, error: "contactIds is required" };
  }

  const campaign = await selectOne(
    db.select().from(campaigns).where(eq(campaigns.id, campaignId)),
  );
  if (!campaign || campaign.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const contactRows = await selectAll(
    db
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.workspaceId, workspaceId), inArray(contacts.id, uniqueIds))),
  );

  if (contactRows.length !== uniqueIds.length) {
    return { ok: false as const, error: "One or more contacts were not found" };
  }

  const stored = await loadStoredWorkspaceData(db, workspaceId);
  const [existingCount] = await db
    .select({ value: count() })
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));

  const current = existingCount?.value ?? 0;
  const existing = await selectAll(
    db
      .select({ contactId: campaignRecipients.contactId })
      .from(campaignRecipients)
      .where(
        and(
          eq(campaignRecipients.campaignId, campaignId),
          inArray(campaignRecipients.contactId, uniqueIds),
        ),
      ),
  );
  const newCount = uniqueIds.length - existing.length;
  if (current + newCount > stored.campaignRecipientsLimit) {
    return { ok: false as const, error: "Campaign recipient limit reached" };
  }

  const now = new Date();
  for (const contactId of uniqueIds) {
    await db
      .insert(campaignRecipients)
      .values({ campaignId, contactId, addedAt: now })
      .onConflictDoNothing();
  }

  const contactCount = await syncCampaignContactCount(db, campaignId);
  return { ok: true as const, contactCount };
}

export async function removeCampaignRecipient(
  db: AppDatabase,
  workspaceId: string,
  campaignId: string,
  contactId: string,
) {
  const campaign = await selectOne(
    db.select().from(campaigns).where(eq(campaigns.id, campaignId)),
  );
  if (!campaign || campaign.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await db
    .delete(campaignRecipients)
    .where(
      and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.contactId, contactId),
      ),
    );

  const contactCount = await syncCampaignContactCount(db, campaignId);
  return { ok: true as const, contactCount };
}

export async function listCampaignRecipients(
  db: AppDatabase,
  workspaceId: string,
  campaignId: string,
) {
  const campaign = await selectOne(
    db.select().from(campaigns).where(eq(campaigns.id, campaignId)),
  );
  if (!campaign || campaign.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const rows = await selectAll(
    db
      .select({ contact: contacts })
      .from(campaignRecipients)
      .innerJoin(contacts, eq(campaignRecipients.contactId, contacts.id))
      .where(eq(campaignRecipients.campaignId, campaignId)),
  );

  return {
    ok: true as const,
    recipients: rows.map((row) => toContact(row.contact)),
    contactCount: rows.length,
  };
}
