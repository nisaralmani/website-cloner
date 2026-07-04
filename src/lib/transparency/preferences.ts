import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";

export const WORKSPACE_TRANSPARENCY_PAGE_SLUG = "workspace/transparency";
export const TRANSPARENCY_COLLECT_LOGS_KEY = "0-0";

function transparencyToggleKey(localKey: string) {
  return `${WORKSPACE_TRANSPARENCY_PAGE_SLUG}::${localKey}`;
}

export async function isTransparencyCollectionEnabled(db: AppDatabase, workspaceId: string) {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, transparencyToggleKey(TRANSPARENCY_COLLECT_LOGS_KEY)),
        ),
      ),
  );

  if (row === null || row === undefined) {
    return true;
  }

  return row.value === "true";
}
