import { and, eq, like } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll, selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";

export async function loadWorkspaceSettingFields(
  db: AppDatabase,
  workspaceId: string,
  pageSlug: string,
  defaults: Record<string, string>,
) {
  const prefix = `${pageSlug}::`;
  const rows = await selectAll(
    db
      .select()
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          like(workspaceSettings.settingKey, `${prefix}%`),
        ),
      ),
  );

  const fields = { ...defaults };
  for (const row of rows) {
    const localKey = row.settingKey.slice(prefix.length);
    if (localKey in defaults) {
      fields[localKey] = row.value;
    }
  }

  return fields;
}

export async function saveWorkspaceSettingField(
  db: AppDatabase,
  workspaceId: string,
  pageSlug: string,
  localKey: string,
  value: string,
) {
  const settingKey = `${pageSlug}::${localKey}`;
  const existing = await selectOne(
    db
      .select()
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, settingKey),
        ),
      ),
  );

  if (existing) {
    await db
      .update(workspaceSettings)
      .set({ value })
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, settingKey),
        ),
      );
  } else {
    await db.insert(workspaceSettings).values({
      workspaceId,
      settingKey,
      value,
    });
  }
}
