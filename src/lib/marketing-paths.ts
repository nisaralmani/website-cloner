/** Public marketing URLs (no /en prefix). */
import { APP_ORIGIN, MARKETING_ORIGIN } from "@/lib/domains";

export function marketingPath(subpath = ""): string {
  if (!subpath || subpath === "/") return "/";
  const path = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return path;
}

export const APP_AUTH_LOGIN_PATH = "/initiate/login";
export const APP_AUTH_FORGOT_PATH = "/initiate/forgot";
export const APP_AUTH_RESET_PATH = "/initiate/reset";
export const APP_AUTH_VERIFY_PATH = "/initiate/verify-email";
export const APP_AUTH_ROOT_PATH = "/initiate";
export const APP_WIDGET_PATH = "/widget";
export const APP_EMBED_SCRIPT_PATH = "/embed.js";

export const APP_INBOX_PATH = "/";
export const APP_AGENT_PATH = "/agent";
export const APP_VISITORS_PATH = "/visitors";
export const APP_CONTACTS_PATH = "/contacts";
export const APP_CAMPAIGNS_PATH = "/campaigns";
export const APP_HELPDESK_PATH = "/helpdesk";
export const APP_ANALYTICS_PATH = "/analytics";
export const APP_PLUGINS_PATH = "/plugins";
export const APP_SETTINGS_ROOT_PATH = "/settings";

export const HELP_CENTER_PATH = "/help-center";
export const DEVELOPER_DOCS_PATH = "/developer-docs";
export const SYSTEM_STATUS_PATH = "/system-status";
export const MARKETING_EN_ROOT_PATH = "/en";

export const APP_API_ROOT_PATH = "/api";
export const APP_AUTH_GOOGLE_PATH = `${APP_API_ROOT_PATH}/auth/google`;

export const MARKETING_CONTACT_PATH = "/contact";
export const MARKETING_SIGNUP_PATH = "/signup";

export function marketingUrl(subpath = ""): string {
  const base = process.env.NEXT_PUBLIC_MARKETING_URL ?? MARKETING_ORIGIN;
  const path = marketingPath(subpath);
  return path === "/" ? base : `${base.replace(/\/$/, "")}${path}`;
}

export function appUrl(subpath = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? APP_ORIGIN;
  if (!subpath || subpath === "/") return base;
  const path = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `${base.replace(/\/$/, "")}${path}`;
}

/** chat.bybelt.com app home. */
export function appHomeUrl(): string {
  return appUrl("/");
}

/** Shareable inbox deep link for a conversation. */
export function appConversationUrl(conversationId: string): string {
  return `${appHomeUrl()}?conversation=${encodeURIComponent(conversationId)}`;
}

/** In-app conversation deep link (relative). */
export function appInboxConversationPath(conversationId: string): string {
  return `${APP_INBOX_PATH}?conversation=${encodeURIComponent(conversationId)}`;
}

/** In-app module route on the chat host. */
export function appModulePath(routePath: string): string {
  if (!routePath || routePath === "/") return APP_INBOX_PATH;
  return routePath.startsWith("/") ? routePath : `/${routePath}`;
}

export function appHelpdeskPath(subpath = ""): string {
  return subpath
    ? appModulePath(`${APP_HELPDESK_PATH}/${subpath.replace(/^\//, "")}`)
    : APP_HELPDESK_PATH;
}

export function appCampaignsPath(subpath = ""): string {
  return subpath
    ? appModulePath(`${APP_CAMPAIGNS_PATH}/${subpath.replace(/^\//, "")}`)
    : APP_CAMPAIGNS_PATH;
}

export function appAnalyticsPath(subpath = ""): string {
  return subpath
    ? appModulePath(`${APP_ANALYTICS_PATH}/${subpath.replace(/^\//, "")}`)
    : APP_ANALYTICS_PATH;
}

/** Widget preview route on the app host. */
export function appWidgetPath(): string {
  return APP_WIDGET_PATH;
}

/** chat.bybelt.com plugins marketplace. */
export function appPluginsUrl(): string {
  return appUrl(APP_PLUGINS_PATH);
}

/** In-app contacts route with optional filter query. */
export function appContactsPath(options?: { segment?: string; q?: string }): string {
  const params = new URLSearchParams();
  if (options?.segment) params.set("segment", options.segment);
  if (options?.q) params.set("q", options.q);
  const query = params.toString();
  return query ? `${APP_CONTACTS_PATH}?${query}` : APP_CONTACTS_PATH;
}

export function helpCenterPath(subpath = ""): string {
  if (!subpath) return HELP_CENTER_PATH;
  return `${HELP_CENTER_PATH}/${subpath.replace(/^\//, "")}`;
}

export function helpCenterArticlePath(articleId: string): string {
  return helpCenterPath(`article/${articleId}`);
}

/** In-app plugins route with optional filter query. */
export function appPluginsPath(options?: { filter?: string; category?: string }): string {
  const params = new URLSearchParams();
  if (options?.filter) params.set("filter", options.filter);
  if (options?.category) params.set("category", options.category);
  const query = params.toString();
  return query ? `${APP_PLUGINS_PATH}?${query}` : APP_PLUGINS_PATH;
}

export function appWidgetUrl(): string {
  return appUrl(APP_WIDGET_PATH);
}

export function appEmbedScriptUrl(): string {
  return appUrl(APP_EMBED_SCRIPT_PATH);
}

/** REST API base on the app host. */
export function appApiBaseUrl(): string {
  return `${appHomeUrl()}/api`;
}

/** Build widget preview URL with query params on the app host. */
export function appWidgetPreviewUrl(query: Record<string, string>): string {
  const params = new URLSearchParams(query);
  return `${appWidgetUrl()}?${params.toString()}`;
}

/** Build app resource URLs from a request origin (local dev fallback). */
export function appResourceUrlFromOrigin(origin: string, path: string): string {
  const base = origin.replace(/\/$/, "");
  const resourcePath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${resourcePath}`;
}

/** www.bybelt.com marketing home. */
export function marketingHomeUrl(): string {
  return marketingUrl("/");
}

/** Relative marketing path (no host). */
export function marketingFeaturePath(featurePath: string): string {
  return marketingPath(featurePath);
}

/** Absolute marketing URL for external footer/blog links. */
export function marketingExternalUrl(path: string): string {
  return marketingUrl(path);
}

/** In-app settings route (chat host). */
export function appSettingsPath(pageSlug: string): string {
  const slug = pageSlug.replace(/^\//, "");
  return `/settings/${slug}`;
}

/** chat.bybelt.com settings deep link. */
export function appSettingsUrl(pageSlug: string): string {
  return appUrl(appSettingsPath(pageSlug));
}

/** www.bybelt.com feature landing (cross-domain from help/docs). */
export function marketingFeatureUrl(featurePath: string): string {
  return marketingUrl(featurePath);
}

/** chat.bybelt.com login — use for marketing CTAs that leave www. */
export function appLoginUrl(): string {
  return appUrl(APP_AUTH_LOGIN_PATH);
}

export function appForgotPasswordUrl(): string {
  return appUrl(APP_AUTH_FORGOT_PATH);
}

/** www.bybelt.com signup — use for cross-domain trial CTAs. */
export function marketingSignupUrl(): string {
  return marketingUrl(MARKETING_SIGNUP_PATH);
}

/** Relative signup path on the marketing host (www). */
export function marketingSignupPath(): string {
  return MARKETING_SIGNUP_PATH;
}

/** www.bybelt.com contact sales page. */
export function marketingContactUrl(): string {
  return marketingUrl(MARKETING_CONTACT_PATH);
}

export function marketingContactPath(): string {
  return marketingPath(MARKETING_CONTACT_PATH);
}

/** Internal Next.js route segment (still /en/* in the filesystem). */
export function marketingInternalPath(subpath = ""): string {
  if (!subpath || subpath === "/") return MARKETING_EN_ROOT_PATH;
  const path = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `${MARKETING_EN_ROOT_PATH}${path}`;
}
