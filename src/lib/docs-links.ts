import { brandOriginUrl } from "@/lib/brand";
import { DOCS_ORIGIN, HELP_ORIGIN, STATUS_ORIGIN } from "@/lib/domains";
import { marketingContactUrl } from "@/lib/marketing-paths";

export const PUBLIC_HELP_CENTER_URL = `${HELP_ORIGIN}/`;
export const PUBLIC_STATUS_URL = `${STATUS_ORIGIN}/`;
export const PUBLIC_DOCS_URL = `${DOCS_ORIGIN}/`;
export const PUBLIC_CONTACT_URL = marketingContactUrl();

/** Developer docs section anchor on docs.bybelt.com. */
export function docsSectionUrl(section: string): string {
  return `${PUBLIC_DOCS_URL}#${section.replace(/^#/, "")}`;
}

/** Central Bybelt documentation URLs for in-app doc buttons. */
export const DOCS_CAMPAIGNS_URL = docsSectionUrl("campaigns");
export const DOCS_HELPDESK_URL = docsSectionUrl("helpdesk");
export const DOCS_CONTACTS_URL = docsSectionUrl("contacts");
export const DOCS_ANALYTICS_URL = docsSectionUrl("analytics");
export const DOCS_PLUGINS_URL = docsSectionUrl("integrations");
export const DOCS_VISITORS_URL = docsSectionUrl("visitors");
export const DOCS_CHAT_WIDGET_URL = docsSectionUrl("chat-widget");
export const DOCS_AI_AGENT_URL = docsSectionUrl("ai-agent");
export const DOCS_INBOX_URL = docsSectionUrl("inbox");
export const DOCS_REST_API_URL = docsSectionUrl("rest-api");
export const DOCS_WEBHOOKS_URL = docsSectionUrl("webhooks");
export const DOCS_API_TOKENS_URL = docsSectionUrl("api-tokens");
export const DOCS_REST_API_REFERENCE_URL = brandOriginUrl(
  PUBLIC_DOCS_URL,
  "/references/rest-api/v1/",
);

export function helpCategoryUrl(categorySlug: string): string {
  return brandOriginUrl(PUBLIC_HELP_CENTER_URL, `/category/${categorySlug}`);
}

export function helpArticleUrl(articleSlug: string): string {
  return brandOriginUrl(PUBLIC_HELP_CENTER_URL, `/article/${articleSlug}`);
}
