import { and, eq, like } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll, selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";
import { decryptSecretField, encryptSecretField } from "@/lib/security/field-encryption";

/**
 * Any field key ending in "Password" is encrypted at rest. This module
 * returns the real decrypted value (callers may need it server-side, e.g. to
 * open an actual IMAP/SMTP connection) — routes that expose settings to the
 * browser must redact password fields themselves before responding.
 */
export function isSecretFieldKey(localKey: string): boolean {
  return localKey.endsWith("Password");
}

export async function loadWorkspaceSettingFields<T extends Record<string, string>>(
  db: AppDatabase,
  workspaceId: string,
  pageSlug: string,
  defaults: T,
): Promise<T> {
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

  const fields: Record<string, string> = { ...defaults };
  for (const row of rows) {
    const localKey = row.settingKey.slice(prefix.length);
    if (localKey in defaults) {
      fields[localKey] = isSecretFieldKey(localKey)
        ? decryptSecretField(row.value)
        : row.value;
    }
  }

  return fields as T;
}

export async function saveWorkspaceSettingField(
  db: AppDatabase,
  workspaceId: string,
  pageSlug: string,
  localKey: string,
  value: string,
) {
  const settingKey = `${pageSlug}::${localKey}`;

  // Password fields: an empty save means "keep the current value" (the
  // browser-facing read path always reports them blank), so skip the write
  // entirely rather than clearing a previously-saved secret.
  if (isSecretFieldKey(localKey) && !value) {
    return;
  }

  const storedValue = isSecretFieldKey(localKey) ? encryptSecretField(value) : value;
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
      .set({ value: storedValue })
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
      value: storedValue,
    });
  }
}
