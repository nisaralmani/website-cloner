import { eq } from "drizzle-orm";
import type { getDb } from "@/db/client";
import { workspaceSubscriptions } from "@/db/schema";
import { DEFAULT_FREE_PLAN } from "@/lib/billing/plans";

export async function ensureWorkspaceSubscription(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const existing = await db
    .select({ workspaceId: workspaceSubscriptions.workspaceId })
    .from(workspaceSubscriptions)
    .where(eq(workspaceSubscriptions.workspaceId, workspaceId))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  await db.insert(workspaceSubscriptions).values({
    workspaceId,
    planTag: DEFAULT_FREE_PLAN.planTag,
    planAmount: DEFAULT_FREE_PLAN.planAmount,
    planPeriod: DEFAULT_FREE_PLAN.planPeriod,
    status: DEFAULT_FREE_PLAN.status,
    billingOwner: DEFAULT_FREE_PLAN.billingOwner,
    monthlyCents: DEFAULT_FREE_PLAN.monthlyCents,
  });
}
