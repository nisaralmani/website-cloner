import { and, asc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll, selectOne } from "@/db/client";
import { chatboxRestrictions, workspaceSettings } from "@/db/schema";
import type { VisitorSessionMeta } from "@/lib/chatbox/visitor-session";
import {
  anyOperatorOnline,
  isHideChatboxOnMobileEnabled,
  isHideChatboxWhenAwayEnabled,
  isMobileUserAgent,
} from "@/lib/chatbox/operator-visibility";

export const CHATBOX_RESTRICTIONS_PAGE_SLUG = "chatbox/restrictions";
export const CHATBOX_VACATION_TOGGLE_KEY = "0-0";

function vacationSettingKey() {
  return `${CHATBOX_RESTRICTIONS_PAGE_SLUG}::${CHATBOX_VACATION_TOGGLE_KEY}`;
}

export async function isChatboxVacationMode(db: AppDatabase, workspaceId: string) {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, vacationSettingKey()),
        ),
      ),
  );
  return row?.value === "true";
}

async function loadRestrictions(db: AppDatabase, workspaceId: string) {
  return selectAll(
    db
      .select()
      .from(chatboxRestrictions)
      .where(eq(chatboxRestrictions.workspaceId, workspaceId))
      .orderBy(asc(chatboxRestrictions.sortOrder)),
  );
}

function pageMatches(ruleValue: string, pageUrl: string) {
  const rule = ruleValue.trim().toLowerCase();
  const page = pageUrl.trim().toLowerCase();
  return page.includes(rule) || rule.includes(page);
}

function countryMatches(ruleValue: string, country: string) {
  const rule = ruleValue.trim().toLowerCase();
  const code = country.trim().toLowerCase();
  return rule === code || rule.includes(code) || code.includes(rule);
}

export type ChatboxAccessResult = {
  allowed: boolean;
  reason?: string;
  chatboxVisible: boolean;
};

export async function evaluateChatboxAccess(
  db: AppDatabase,
  workspaceId: string,
  meta: VisitorSessionMeta = {},
  userAgent?: string | null,
): Promise<ChatboxAccessResult> {
  if (await isChatboxVacationMode(db, workspaceId)) {
    return { allowed: false, chatboxVisible: false, reason: "Chatbox is on vacation" };
  }

  if (await isHideChatboxWhenAwayEnabled(db, workspaceId)) {
    const online = await anyOperatorOnline(db, workspaceId);
    if (!online) {
      return { allowed: false, chatboxVisible: false, reason: "All operators are away" };
    }
  }

  if (await isHideChatboxOnMobileEnabled(db, workspaceId) && isMobileUserAgent(userAgent)) {
    return { allowed: false, chatboxVisible: false, reason: "Chatbox is hidden on mobile" };
  }

  const restrictions = await loadRestrictions(db, workspaceId);
  const pageUrl = meta.pageUrl?.trim() ?? "";
  const country = meta.country?.trim().toUpperCase() ?? "US";
  const locale = meta.locale?.trim().toLowerCase() ?? "";
  const ip = meta.ip?.trim() ?? "";

  const allowedPages = restrictions.filter((row) => row.kind === "allowed_page");
  if (allowedPages.length > 0 && pageUrl) {
    const matchesAllowed = allowedPages.some((row) => pageMatches(row.value, pageUrl));
    if (!matchesAllowed) {
      return { allowed: false, chatboxVisible: false, reason: "Page is not in allowed list" };
    }
  }

  for (const row of restrictions) {
    if (row.kind === "blocked_page" && pageUrl && pageMatches(row.value, pageUrl)) {
      return { allowed: false, chatboxVisible: false, reason: "Page is blocked" };
    }
    if (row.kind === "blocked_country" && countryMatches(row.value, country)) {
      return { allowed: false, chatboxVisible: false, reason: "Country is blocked" };
    }
    if (row.kind === "blocked_locale" && locale && row.value.trim().toLowerCase() === locale) {
      return { allowed: false, chatboxVisible: false, reason: "Locale is blocked" };
    }
    if (row.kind === "blocked_ip" && ip && row.value.trim() === ip) {
      return { allowed: false, chatboxVisible: false, reason: "IP is blocked" };
    }
  }

  return { allowed: true, chatboxVisible: true };
}
