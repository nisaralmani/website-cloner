import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";

export const EMAIL_BEHAVIOR_PAGE_SLUG = "email/behavior";
export const EMAIL_RATINGS_ENABLED_KEY = "0-1";

function emailBehaviorToggleKey(localKey: string) {
  return `${EMAIL_BEHAVIOR_PAGE_SLUG}::${localKey}`;
}

export async function isRatingsEnabled(db: AppDatabase, workspaceId: string) {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, emailBehaviorToggleKey(EMAIL_RATINGS_ENABLED_KEY)),
        ),
      ),
  );

  if (row === null || row === undefined) {
    return true;
  }

  return row.value === "true";
}
