import {
  APP_ORIGIN,
  DOCS_ORIGIN,
  HELP_ORIGIN,
  MARKETING_ORIGIN,
  STATUS_ORIGIN,
} from "@/lib/domains";

/** Build a URL on a brand origin (marketing, help, docs, etc.). */
export function brandOriginUrl(origin: string, path = ""): string {
  const base = origin.replace(/\/$/, "");
  if (!path || path === "/") return `${base}/`;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

/** Central Bybelt brand constants — use for titles, links, and copy. */
export const BRAND_NAME = "Bybelt";
export const BRAND_LEGAL_NAME = "Bybelt";
export const BRAND_DOMAIN = "bybelt.com";
export const BRAND_APP_URL = APP_ORIGIN;
export const BRAND_MARKETING_URL = MARKETING_ORIGIN;
export const BRAND_HELP_URL = `${HELP_ORIGIN}/`;
export const BRAND_DOCS_URL = `${DOCS_ORIGIN}/`;
export const BRAND_STATUS_URL = `${STATUS_ORIGIN}/`;
export const BRAND_CONTACT_URL = brandOriginUrl(MARKETING_ORIGIN, "/contact/");
export const BRAND_EMAIL_DOMAIN = ".on.bybelt.com";
