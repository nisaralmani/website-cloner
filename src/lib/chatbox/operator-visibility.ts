import { and, asc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { users, workspaceMembers, workspaceSettings } from "@/db/schema";
import { CHATBOX_BEHAVIOR_PAGE_SLUG } from "@/lib/chatbox/attachment-preferences";
import { isOperatorOnline } from "@/lib/workspaces/operators";

export const CHATBOX_HIDE_WHEN_AWAY_KEY = "5-0";
export const CHATBOX_HIDE_ON_MOBILE_KEY = "5-1";
export const CHATBOX_OPERATOR_PRIVACY_KEY = "6-0";
export const CHATBOX_MAGIC_TYPE_KEY = "6-1";

function behaviorToggleKey(localKey: string) {
  return `${CHATBOX_BEHAVIOR_PAGE_SLUG}::${localKey}`;
}

async function readBehaviorToggle(
  db: AppDatabase,
  workspaceId: string,
  localKey: string,
  defaultValue: boolean,
) {
  const row = await db
    .select({ value: workspaceSettings.value })
    .from(workspaceSettings)
    .where(
      and(
        eq(workspaceSettings.workspaceId, workspaceId),
        eq(workspaceSettings.settingKey, behaviorToggleKey(localKey)),
      ),
    )
    .limit(1);

  if (row.length === 0) {
    return defaultValue;
  }

  return row[0]?.value === "true";
}

export async function isHideChatboxWhenAwayEnabled(db: AppDatabase, workspaceId: string) {
  return readBehaviorToggle(db, workspaceId, CHATBOX_HIDE_WHEN_AWAY_KEY, false);
}

export async function isHideChatboxOnMobileEnabled(db: AppDatabase, workspaceId: string) {
  return readBehaviorToggle(db, workspaceId, CHATBOX_HIDE_ON_MOBILE_KEY, false);
}

export async function isOperatorPrivacyModeEnabled(db: AppDatabase, workspaceId: string) {
  return readBehaviorToggle(db, workspaceId, CHATBOX_OPERATOR_PRIVACY_KEY, false);
}

export async function isMagicTypeEnabled(db: AppDatabase, workspaceId: string) {
  return readBehaviorToggle(db, workspaceId, CHATBOX_MAGIC_TYPE_KEY, true);
}

export async function anyOperatorOnline(db: AppDatabase, workspaceId: string) {
  const rows = await selectAll(
    db
      .select({ user: users })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId))
      .orderBy(asc(users.name)),
  );

  return rows.some((row) => isOperatorOnline(row.user));
}

export function isMobileUserAgent(userAgent: string | null | undefined) {
  const ua = userAgent?.toLowerCase() ?? "";
  return /android|iphone|ipad|ipod|mobile|webos|blackberry|iemobile|opera mini/i.test(ua);
}
