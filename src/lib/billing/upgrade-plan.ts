import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { workspaceSubscriptions } from "@/db/schema";
import { toWorkspacePlan } from "@/lib/billing/plans";
import { workspaces } from "@/db/schema";

const PLAN_TAGS = new Set(["Free", "Essentials", "Plus", "Pro"]);

function planFeatureFlags(planTag: string) {
  if (planTag === "Free") {
    return { analyticsEnabled: 0, helpdeskEnabled: 0 };
  }
  if (planTag === "Essentials") {
    return { analyticsEnabled: 1, helpdeskEnabled: 0 };
  }
  return { analyticsEnabled: 1, helpdeskEnabled: 1 };
}

export async function upgradeWorkspacePlan(
  db: AppDatabase,
  workspaceId: string,
  planTag: string,
) {
  const tag = planTag.trim();
  if (!PLAN_TAGS.has(tag)) {
    return { ok: false as const, error: "planTag is invalid" };
  }

  const monthlyCents =
    tag === "Free" ? 0 : tag === "Essentials" ? 2500 : tag === "Plus" ? 9500 : 25000;

  const existing = await selectOne(
    db
      .select()
      .from(workspaceSubscriptions)
      .where(eq(workspaceSubscriptions.workspaceId, workspaceId)),
  );

  if (!existing) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await db
    .update(workspaceSubscriptions)
    .set({
      planTag: tag,
      planAmount: tag === "Free" ? "Free" : `$${monthlyCents / 100}`,
      monthlyCents,
      status: "Active",
    })
    .where(eq(workspaceSubscriptions.workspaceId, workspaceId));

  await db
    .update(workspaces)
    .set(planFeatureFlags(tag))
    .where(eq(workspaces.id, workspaceId));

  const workspace = await selectOne(
    db.select().from(workspaces).where(eq(workspaces.id, workspaceId)),
  );
  const subscription = await selectOne(
    db
      .select()
      .from(workspaceSubscriptions)
      .where(eq(workspaceSubscriptions.workspaceId, workspaceId)),
  );

  if (!workspace || !subscription) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, plan: toWorkspacePlan(workspace, subscription) };
}
