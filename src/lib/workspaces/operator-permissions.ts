import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";

export const WORKSPACE_OPERATORS_PAGE_SLUG = "workspace/operators";
export const PREVENT_NON_OWNER_DELETE_KEY = "0-0";

function operatorsToggleKey(localKey: string) {
  return `${WORKSPACE_OPERATORS_PAGE_SLUG}::${localKey}`;
}

export async function isPreventNonOwnerDeleteEnabled(db: AppDatabase, workspaceId: string) {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, operatorsToggleKey(PREVENT_NON_OWNER_DELETE_KEY)),
        ),
      ),
  );
  return row?.value === "true";
}

export async function assertCanDeleteWorkspaceData(
  db: AppDatabase,
  workspaceId: string,
  role: string,
) {
  if (role === "owner") {
    return null;
  }

  const restricted = await isPreventNonOwnerDeleteEnabled(db, workspaceId);
  if (restricted) {
    return "Only workspace owners can delete data";
  }

  return null;
}
