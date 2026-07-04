import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";

export const CHATBOX_SECURITY_PAGE_SLUG = "chatbox/security";
export const CHATBOX_DOMAIN_LOCK_KEY = "0-0";

function securityToggleKey(localKey: string) {
  return `${CHATBOX_SECURITY_PAGE_SLUG}::${localKey}`;
}

export async function isChatboxDomainLockEnabled(db: AppDatabase, workspaceId: string) {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, securityToggleKey(CHATBOX_DOMAIN_LOCK_KEY)),
        ),
      ),
  );
  return row?.value === "true";
}

export function domainMatchesWorkspace(workspaceDomain: string, requestDomain: string) {
  const workspace = workspaceDomain.trim().toLowerCase();
  const request = requestDomain.trim().toLowerCase();
  if (!workspace || !request) {
    return true;
  }
  return request === workspace || request.endsWith(`.${workspace}`);
}

export async function assertChatboxDomainAllowed(
  db: AppDatabase,
  workspaceId: string,
  workspaceDomain: string,
  requestDomain?: string | null,
) {
  const locked = await isChatboxDomainLockEnabled(db, workspaceId);
  if (!locked) {
    return null;
  }

  const domain = requestDomain?.trim();
  if (!domain) {
    return "Chatbox domain lock requires a valid domain";
  }

  if (!domainMatchesWorkspace(workspaceDomain, domain)) {
    return "Chatbox is locked to workspace domain";
  }

  return null;
}
