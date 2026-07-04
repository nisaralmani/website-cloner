import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";

export const EMAIL_BEHAVIOR_PAGE_SLUG = "email/behavior";
export const EMAIL_SIGNATURE_ENABLED_KEY = "1-0";
export const EMAIL_SIGNATURE_TEXT_SETTING_KEY = `${EMAIL_BEHAVIOR_PAGE_SLUG}::signatureText`;

function signatureToggleKey() {
  return `${EMAIL_BEHAVIOR_PAGE_SLUG}::${EMAIL_SIGNATURE_ENABLED_KEY}`;
}

async function readWorkspaceSetting(workspaceId: string, settingKey: string) {
  const db = await getDb();
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, settingKey),
        ),
      ),
  );
  return row?.value ?? null;
}

export async function isEmailSignatureEnabled(workspaceId: string) {
  const value = await readWorkspaceSetting(workspaceId, signatureToggleKey());
  if (value === null) {
    return false;
  }
  return value === "true";
}

export async function getEmailSignatureText(workspaceId: string) {
  return (await readWorkspaceSetting(workspaceId, EMAIL_SIGNATURE_TEXT_SETTING_KEY)) ?? "";
}

export async function setEmailSignature(
  workspaceId: string,
  input: { enabled: boolean; text: string },
) {
  const db = await getDb();
  const trimmed = input.text.trim();

  for (const [settingKey, value] of [
    [signatureToggleKey(), input.enabled ? "true" : "false"],
    [EMAIL_SIGNATURE_TEXT_SETTING_KEY, trimmed],
  ] as const) {
    const existing = await selectOne(
      db
        .select({ value: workspaceSettings.value })
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
      await db.insert(workspaceSettings).values({ workspaceId, settingKey, value });
    }
  }

  return { enabled: input.enabled, text: trimmed };
}

export async function appendEmailSignature(workspaceId: string, body: string) {
  const enabled = await isEmailSignatureEnabled(workspaceId);
  if (!enabled) {
    return body;
  }

  const signature = (await getEmailSignatureText(workspaceId)).trim();
  if (!signature) {
    return body;
  }

  return `${body.trim()}\n\n--\n${signature}`;
}
