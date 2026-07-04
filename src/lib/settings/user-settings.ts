import { and, eq, like } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll, selectOne } from "@/db/client";
import { userSettings } from "@/db/schema";

export async function loadUserSettingToggles(
  db: AppDatabase,
  userId: string,
  pageSlug: string,
  defaults: Record<string, boolean>,
) {
  const prefix = `${pageSlug}::`;
  const rows = await selectAll(
    db
      .select()
      .from(userSettings)
      .where(and(eq(userSettings.userId, userId), like(userSettings.settingKey, `${prefix}%`))),
  );

  const toggles = { ...defaults };
  for (const row of rows) {
    const localKey = row.settingKey.slice(prefix.length);
    toggles[localKey] = row.value === "true";
  }

  return toggles;
}

export async function saveUserSettingToggle(
  db: AppDatabase,
  userId: string,
  settingKey: string,
  on: boolean,
) {
  await saveUserSettingValue(db, userId, settingKey, on ? "true" : "false");
}

export async function loadUserSettingFields(
  db: AppDatabase,
  userId: string,
  pageSlug: string,
  defaults: Record<string, string>,
) {
  const prefix = `${pageSlug}::`;
  const rows = await selectAll(
    db
      .select()
      .from(userSettings)
      .where(and(eq(userSettings.userId, userId), like(userSettings.settingKey, `${prefix}%`))),
  );

  const fields = { ...defaults };
  for (const row of rows) {
    const localKey = row.settingKey.slice(prefix.length);
    fields[localKey] = row.value;
  }

  return fields;
}

export async function saveUserSettingValue(
  db: AppDatabase,
  userId: string,
  settingKey: string,
  value: string,
) {
  const existing = await selectOne(
    db
      .select()
      .from(userSettings)
      .where(and(eq(userSettings.userId, userId), eq(userSettings.settingKey, settingKey))),
  );

  if (existing) {
    await db
      .update(userSettings)
      .set({ value })
      .where(and(eq(userSettings.userId, userId), eq(userSettings.settingKey, settingKey)));
  } else {
    await db.insert(userSettings).values({
      userId,
      settingKey,
      value,
    });
  }
}

export async function saveUserSettingField(
  db: AppDatabase,
  userId: string,
  pageSlug: string,
  localKey: string,
  value: string,
) {
  const settingKey = `${pageSlug}::${localKey}`;
  await saveUserSettingValue(db, userId, settingKey, value);
}
