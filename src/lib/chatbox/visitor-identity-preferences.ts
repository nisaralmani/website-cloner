import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { conversations, visitorChatSessions, workspaceSettings } from "@/db/schema";
import { CHATBOX_BEHAVIOR_PAGE_SLUG } from "@/lib/chatbox/attachment-preferences";

export const CHATBOX_ASK_EMAIL_KEY = "1-0";
export const CHATBOX_ASK_PHONE_KEY = "1-1";
export const CHATBOX_FORCE_IDENTIFY_KEY = "1-2";

function behaviorToggleKey(localKey: string) {
  return `${CHATBOX_BEHAVIOR_PAGE_SLUG}::${localKey}`;
}

async function readChatboxBehaviorToggle(
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
          eq(workspaceSettings.settingKey, behaviorToggleKey(localKey)),
        ),
      ),
  );

  if (row === null || row === undefined) {
    return defaultValue;
  }

  return row.value === "true";
}

export async function getChatboxVisitorIdentityPreferences(
  db: AppDatabase,
  workspaceId: string,
) {
  const [askEmail, askPhone, forceIdentify] = await Promise.all([
    readChatboxBehaviorToggle(db, workspaceId, CHATBOX_ASK_EMAIL_KEY, true),
    readChatboxBehaviorToggle(db, workspaceId, CHATBOX_ASK_PHONE_KEY, false),
    readChatboxBehaviorToggle(db, workspaceId, CHATBOX_FORCE_IDENTIFY_KEY, false),
  ]);

  return { askEmail, askPhone, forceIdentify };
}

export function sessionHasIdentity(session: { email?: string | null; phone?: string | null }) {
  return Boolean(session.email?.trim() || session.phone?.trim());
}

export async function updateVisitorSessionIdentity(
  db: AppDatabase,
  sessionId: string,
  conversationId: string,
  input: { email?: string; phone?: string },
) {
  const updates: { email?: string | null; phone?: string | null } = {};
  const conversationUpdates: { customerEmail?: string | null } = {};

  if (input.email !== undefined) {
    const trimmed = input.email.trim();
    updates.email = trimmed || null;
    conversationUpdates.customerEmail = trimmed || null;
  }

  if (input.phone !== undefined) {
    const trimmed = input.phone.trim();
    updates.phone = trimmed || null;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(visitorChatSessions).set(updates).where(eq(visitorChatSessions.id, sessionId));
  }

  if (conversationUpdates.customerEmail !== undefined) {
    await db
      .update(conversations)
      .set(conversationUpdates)
      .where(eq(conversations.id, conversationId));
  }
}

export async function assertVisitorCanSendMessage(
  db: AppDatabase,
  workspaceId: string,
  session: { email?: string | null; phone?: string | null },
) {
  const { forceIdentify } = await getChatboxVisitorIdentityPreferences(db, workspaceId);
  if (forceIdentify && !sessionHasIdentity(session)) {
    return "Identification is required before sending messages";
  }
  return null;
}
