import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversations, workspaceSettings } from "@/db/schema";
import { isWorkspaceOperator } from "@/lib/inbox/conversation-assignment";

export const INBOX_ROUTING_PAGE_SLUG = "inbox/routing";
export const INBOX_ROUTING_ASSIGN_ON_RESPONSE_KEY = "0-0";
export const INBOX_ROUTING_RULES_ENABLED_KEY = "1-0";
export const INBOX_ROUTING_RERUN_OFFLINE_KEY = "1-2";

function assignOnResponseSettingKey() {
  return `${INBOX_ROUTING_PAGE_SLUG}::${INBOX_ROUTING_ASSIGN_ON_RESPONSE_KEY}`;
}

function routingToggleKey(localKey: string) {
  return `${INBOX_ROUTING_PAGE_SLUG}::${localKey}`;
}

async function readRoutingToggle(
  db: AppDatabase,
  workspaceId: string,
  localKey: string,
  defaultValue: boolean,
): Promise<boolean> {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, routingToggleKey(localKey)),
        ),
      ),
  );

  if (row === null || row === undefined) {
    return defaultValue;
  }

  return row.value === "true";
}

export async function isRoutingRulesEnabled(db: AppDatabase, workspaceId: string) {
  return readRoutingToggle(db, workspaceId, INBOX_ROUTING_RULES_ENABLED_KEY, false);
}

export async function isRerunWhenOfflineEnabled(db: AppDatabase, workspaceId: string) {
  return readRoutingToggle(db, workspaceId, INBOX_ROUTING_RERUN_OFFLINE_KEY, false);
}

export async function isAssignOnResponseEnabled(
  db: AppDatabase,
  workspaceId: string,
): Promise<boolean> {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, assignOnResponseSettingKey()),
        ),
      ),
  );

  return row?.value === "true";
}

export async function autoAssignOperatorOnReply(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  operatorId: string,
): Promise<boolean> {
  const enabled = await isAssignOnResponseEnabled(db, workspaceId);
  if (!enabled) {
    return false;
  }

  const conversation = await selectOne(
    db.select().from(conversations).where(eq(conversations.id, conversationId)),
  );

  if (!conversation || conversation.assignedOperatorId) {
    return false;
  }

  const isMember = await isWorkspaceOperator(db, workspaceId, operatorId);
  if (!isMember) {
    return false;
  }

  await db
    .update(conversations)
    .set({ assignedOperatorId: operatorId })
    .where(eq(conversations.id, conversationId));

  return true;
}
