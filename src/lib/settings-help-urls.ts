import { helpArticleUrl, helpCategoryUrl, PUBLIC_HELP_CENTER_URL } from "@/lib/docs-links";

/** Help Center article/category URLs keyed by settings page slug. */
const SETTINGS_HELP_URLS: Record<string, string> = {
  "account/availability": helpCategoryUrl("availability/"),
  "account/security": helpCategoryUrl("security/"),
  "billing/cards": helpCategoryUrl("billing/"),
  "billing/invoices": helpCategoryUrl("billing/"),
  "workspace/information": helpCategoryUrl("workspace-settings/"),
  "workspace/integrations": helpCategoryUrl("integrations/"),
  "workspace/operators": helpCategoryUrl("operators/"),
  "workspace/billing": helpCategoryUrl("billing/"),
  "workspace/transparency": helpCategoryUrl("workspace-settings/"),
  "workspace/advanced": helpCategoryUrl("workspace-settings/"),
  "workspace/data": helpCategoryUrl("workspace-settings/"),
  "workspace/danger": helpCategoryUrl("workspace-settings/"),
  "chatbox/appearance": helpCategoryUrl("appearance-1h9p8l/"),
  "chatbox/behavior": helpCategoryUrl("chatbox/"),
  "chatbox/search-ai": helpCategoryUrl("chatbox/"),
  "chatbox/security": helpCategoryUrl("chatbox/"),
  "chatbox/restrictions": helpCategoryUrl("chatbox/"),
  "chatbox/push": helpCategoryUrl("chatbox/"),
  "inbox/routing": helpCategoryUrl("inbox/"),
  "inbox/shortcuts": helpCategoryUrl("inbox/"),
};

export const SETTINGS_KEYBOARD_SHORTCUTS_URL = helpCategoryUrl("inbox/");

export function settingsHelpUrl(pageSlug: string): string {
  return SETTINGS_HELP_URLS[pageSlug] ?? PUBLIC_HELP_CENTER_URL;
}

export const ANALYTICS_HELP_VIDEO_URL = helpCategoryUrl("analytics/");

export const HELPDESK_HELP_VIDEO_URL = helpCategoryUrl("knowledge-base/");

/** Login carousel + auth marketing feature links. */
export const AUTH_HELP_ARTICLE_TRIGGERS = helpArticleUrl("pq0znd");
export const AUTH_HELP_CATEGORY_APPEARANCE = helpCategoryUrl("appearance-1h9p8l/");
export const AUTH_HELP_CATEGORY_AI_AGENT = helpCategoryUrl("ai-agent-1k8p7m/");
