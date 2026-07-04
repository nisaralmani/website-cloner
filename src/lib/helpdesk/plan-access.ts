import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { workspaces } from "@/db/schema";

export async function assertHelpdeskWritesAllowed(db: AppDatabase, workspaceId: string) {
  const workspace = await selectOne(
    db
      .select({ helpdeskEnabled: workspaces.helpdeskEnabled })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId)),
  );

  if (workspace?.helpdeskEnabled !== 1) {
    return "Helpdesk is not enabled on your plan";
  }

  return null;
}
