import { settingsTree } from "@/lib/settings-data";
import {
  APP_CONTACTS_PATH,
  APP_INBOX_PATH,
  APP_PLUGINS_PATH,
  APP_SETTINGS_ROOT_PATH,
  appAnalyticsPath,
  appHelpdeskPath,
  appSettingsPath,
} from "@/lib/marketing-paths";
import type { SearchResult } from "@/types/search";

export const SEARCH_QUICK_LINKS: SearchResult[] = [
  { id: "nav-inbox", kind: "navigation", title: "Inbox", href: APP_INBOX_PATH },
  { id: "nav-contacts", kind: "navigation", title: "Contacts", href: APP_CONTACTS_PATH },
  {
    id: "nav-helpdesk",
    kind: "navigation",
    title: "Knowledge Base",
    href: appHelpdeskPath("articles"),
  },
  {
    id: "nav-analytics",
    kind: "navigation",
    title: "Analytics",
    href: appAnalyticsPath("messaging/overview"),
  },
  { id: "nav-plugins", kind: "navigation", title: "Plugins", href: APP_PLUGINS_PATH },
  { id: "nav-settings", kind: "navigation", title: "Settings", href: APP_SETTINGS_ROOT_PATH },
];

export function searchSettingsPages(query: string, limit = 6): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const matches: SearchResult[] = [];
  for (const category of settingsTree) {
    for (const item of category.items) {
      const haystack = `${category.label} ${item.label} ${item.slug}`.toLowerCase();
      if (!haystack.includes(normalized)) continue;
      matches.push({
        id: `settings-${item.slug}`,
        kind: "settings",
        title: item.label,
        subtitle: category.label,
        href: appSettingsPath(item.slug),
      });
    }
  }

  return matches.slice(0, limit);
}

export function searchQuickNavigation(query: string, limit = 6): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return SEARCH_QUICK_LINKS;
  return SEARCH_QUICK_LINKS.filter((item) =>
    item.title.toLowerCase().includes(normalized) ||
    item.href.toLowerCase().includes(normalized)
  ).slice(0, limit);
}
