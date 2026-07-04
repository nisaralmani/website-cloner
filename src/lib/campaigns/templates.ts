import { randomUUID } from "crypto";
import { and, asc, eq, max } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll, selectOne } from "@/db/client";
import { campaignTemplates } from "@/db/schema";
import { toCampaignTemplate } from "@/lib/campaigns/mappers";
import type { CampaignTemplate } from "@/types/campaigns";

const VALID_CATEGORIES = new Set<CampaignTemplate["category"]>(["bybelt", "yours"]);

export async function createCampaignTemplate(
  db: AppDatabase,
  workspaceId: string,
  input: { name: string; category: CampaignTemplate["category"] },
) {
  const name = input.name.trim();
  if (!name) {
    return { ok: false as const, error: "name is required" };
  }
  if (!VALID_CATEGORIES.has(input.category)) {
    return { ok: false as const, error: "category is invalid" };
  }

  const [maxOrder] = await db
    .select({ value: max(campaignTemplates.sortOrder) })
    .from(campaignTemplates)
    .where(eq(campaignTemplates.workspaceId, workspaceId));

  const id = randomUUID();
  await db.insert(campaignTemplates).values({
    id,
    workspaceId,
    name,
    category: input.category,
    sortOrder: (maxOrder?.value ?? -1) + 1,
  });

  const row = await selectOne(db.select().from(campaignTemplates).where(eq(campaignTemplates.id, id)));
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, template: toCampaignTemplate(row) };
}

export async function updateCampaignTemplate(
  db: AppDatabase,
  workspaceId: string,
  templateId: string,
  input: { name?: string; category?: CampaignTemplate["category"] },
) {
  const existing = await selectOne(
    db.select().from(campaignTemplates).where(eq(campaignTemplates.id, templateId)),
  );
  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const updates: { name?: string; category?: string } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      return { ok: false as const, error: "name is required" };
    }
    updates.name = name;
  }
  if (input.category !== undefined) {
    if (!VALID_CATEGORIES.has(input.category)) {
      return { ok: false as const, error: "category is invalid" };
    }
    updates.category = input.category;
  }

  await db.update(campaignTemplates).set(updates).where(eq(campaignTemplates.id, templateId));
  const row = await selectOne(db.select().from(campaignTemplates).where(eq(campaignTemplates.id, templateId)));
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, template: toCampaignTemplate(row) };
}

export async function deleteCampaignTemplate(
  db: AppDatabase,
  workspaceId: string,
  templateId: string,
) {
  const existing = await selectOne(
    db.select().from(campaignTemplates).where(eq(campaignTemplates.id, templateId)),
  );
  if (!existing || existing.workspaceId !== workspaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await db.delete(campaignTemplates).where(eq(campaignTemplates.id, templateId));
  return { ok: true as const, id: templateId };
}

export async function listCampaignTemplates(db: AppDatabase, workspaceId: string) {
  const rows = await selectAll(
    db
      .select()
      .from(campaignTemplates)
      .where(eq(campaignTemplates.workspaceId, workspaceId))
      .orderBy(asc(campaignTemplates.sortOrder)),
  );
  return rows.map(toCampaignTemplate);
}
