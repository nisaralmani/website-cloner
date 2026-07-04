import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { getDb, selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";

export const EMAIL_DELIVERY_PAGE_SLUG = "email/delivery";
export const EMAIL_CUSTOM_SMTP_KEY = "1-0";

function deliveryToggleKey(localKey: string) {
  return `${EMAIL_DELIVERY_PAGE_SLUG}::${localKey}`;
}

export async function isCustomSmtpEnabled(db: AppDatabase, workspaceId: string) {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, deliveryToggleKey(EMAIL_CUSTOM_SMTP_KEY)),
        ),
      ),
  );
  return row?.value === "true";
}

export async function isCustomSmtpEnabledForWorkspace(workspaceId: string) {
  const db = await getDb();
  return isCustomSmtpEnabled(db, workspaceId);
}
