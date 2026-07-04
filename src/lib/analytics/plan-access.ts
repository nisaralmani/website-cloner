import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { workspaces } from "@/db/schema";

export async function assertAnalyticsWritesAllowed(db: AppDatabase, workspaceId: string) {
  const workspace = await selectOne(
    db
      .select({ analyticsEnabled: workspaces.analyticsEnabled })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId)),
  );

  if (workspace?.analyticsEnabled !== 1) {
    return "Analytics is not enabled on your plan";
  }

  return null;
}
