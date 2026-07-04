import type { MetadataRoute } from "next";

import { APP_ORIGIN, DOCS_ORIGIN, HELP_ORIGIN, STATUS_ORIGIN, MARKETING_ORIGIN } from "@/lib/domains";
import {
  APP_AGENT_PATH,
  APP_ANALYTICS_PATH,
  APP_AUTH_FORGOT_PATH,
  APP_AUTH_LOGIN_PATH,
  APP_AUTH_RESET_PATH,
  APP_AUTH_VERIFY_PATH,
  APP_CAMPAIGNS_PATH,
  APP_CONTACTS_PATH,
  APP_EMBED_SCRIPT_PATH,
  APP_HELPDESK_PATH,
  APP_INBOX_PATH,
  APP_PLUGINS_PATH,
  APP_SETTINGS_ROOT_PATH,
  APP_VISITORS_PATH,
  APP_WIDGET_PATH,
  DEVELOPER_DOCS_PATH,
  HELP_CENTER_PATH,
  SYSTEM_STATUS_PATH,
} from "@/lib/marketing-paths";

import { MARKETING_SITEMAP_PATHS } from "@/lib/marketing-pages";

import { getPublicHelpArticleSitemapEntries } from "@/lib/sitemap-public-help";

const APP_PATHS = [
  APP_INBOX_PATH,
  APP_AUTH_LOGIN_PATH,
  APP_AUTH_FORGOT_PATH,
  APP_AUTH_RESET_PATH,
  APP_AUTH_VERIFY_PATH,
  APP_EMBED_SCRIPT_PATH,
  APP_WIDGET_PATH,
  APP_AGENT_PATH,
  APP_VISITORS_PATH,
  APP_CONTACTS_PATH,
  APP_CAMPAIGNS_PATH,
  APP_HELPDESK_PATH,
  APP_ANALYTICS_PATH,
  APP_PLUGINS_PATH,
  APP_SETTINGS_ROOT_PATH,
] as const;

const SUBDOMAIN_PATHS = [
  { origin: HELP_ORIGIN, paths: [HELP_CENTER_PATH] as const },
  { origin: DOCS_ORIGIN, paths: [DEVELOPER_DOCS_PATH] as const },
  { origin: STATUS_ORIGIN, paths: [SYSTEM_STATUS_PATH] as const },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const marketingEntries = MARKETING_SITEMAP_PATHS.map((path) => ({
    url: `${MARKETING_ORIGIN}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const appEntries = APP_PATHS.map((path) => ({
    url: `${APP_ORIGIN}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 0.9 : 0.6,
  }));

  const subdomainEntries = SUBDOMAIN_PATHS.flatMap(({ origin, paths }) =>
    paths.map((path) => ({
      url: `${origin}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  const helpArticleEntries = await getPublicHelpArticleSitemapEntries();

  return [...marketingEntries, ...appEntries, ...subdomainEntries, ...helpArticleEntries];
}
