import { randomUUID } from "crypto";
import { eq, max } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { campaigns } from "@/db/schema";
import { toCampaign } from "@/lib/campaigns/mappers";
import type { CampaignStatus, CampaignType } from "@/types/campaigns";

const VALID_TYPES = new Set<CampaignType>(["automated", "one-shot"]);
const VALID_STATUSES = new Set<CampaignStatus>(["draft", "scheduled", "sent", "paused"]);

export async function createCampaign(
  db: AppDatabase,
  workspaceId: string,
  input: { name: string; type: CampaignType; status?: CampaignStatus },
) {
  const name = input.name.trim();
  if (!name) {
    return { ok: false as const, error: "name is required" };
  }

  if (!VALID_TYPES.has(input.type)) {
    return { ok: false as const, error: "type must be automated or one-shot" };
  }

  const status = input.status ?? "draft";
  if (!VALID_STATUSES.has(status)) {
    return { ok: false as const, error: "status is invalid" };
  }

  const [maxOrderRow] = await db
    .select({ value: max(campaigns.sortOrder) })
    .from(campaigns)
    .where(eq(campaigns.workspaceId, workspaceId));

  const id = randomUUID();
  const nowLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  await db.insert(campaigns).values({
    id,
    workspaceId,
    name,
    type: input.type,
    status,
    contactCount: 0,
    lastUpdate: nowLabel,
    sortOrder: (maxOrderRow?.value ?? -1) + 1,
  });

  const row = await selectOne(db.select().from(campaigns).where(eq(campaigns.id, id)));
  if (!row) {
    return { ok: false as const, error: "Failed to create campaign" };
  }

  return { ok: true as const, campaign: toCampaign(row) };
}
