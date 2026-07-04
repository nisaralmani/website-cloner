import { APP_API_ROOT_PATH, helpCenterArticlePath } from "@/lib/marketing-paths";

/** Default workspace domain for public help center articles (seed workspace). */
export const PUBLIC_HELPDESK_DOMAIN = "fashionsis.com";

export const PUBLIC_HELPDESK_API_PATH = `${APP_API_ROOT_PATH}/helpdesk/public`;

export { helpCenterArticlePath };

export function publicHelpdeskListApiPath(domain = PUBLIC_HELPDESK_DOMAIN): string {
  return `${PUBLIC_HELPDESK_API_PATH}?domain=${encodeURIComponent(domain)}`;
}

export function publicHelpdeskArticleApiPath(
  articleId: string,
  domain = PUBLIC_HELPDESK_DOMAIN,
): string {
  return `${PUBLIC_HELPDESK_API_PATH}/${encodeURIComponent(articleId)}?domain=${encodeURIComponent(domain)}`;
}

export function publicHelpdeskArticleHelpfulApiPath(
  articleId: string,
  domain = PUBLIC_HELPDESK_DOMAIN,
): string {
  return `${PUBLIC_HELPDESK_API_PATH}/${encodeURIComponent(articleId)}/helpful?domain=${encodeURIComponent(domain)}`;
}

export function publicHelpdeskListUrl(origin: string, domain = PUBLIC_HELPDESK_DOMAIN) {
  return `${origin.replace(/\/$/, "")}${publicHelpdeskListApiPath(domain)}`;
}

export function publicHelpdeskArticleUrl(
  origin: string,
  articleId: string,
  domain = PUBLIC_HELPDESK_DOMAIN,
) {
  return `${origin.replace(/\/$/, "")}${publicHelpdeskArticleApiPath(articleId, domain)}`;
}
