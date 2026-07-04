import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @returns {string[]} e.g. `account/information` */
export function parseSettingsSlugs() {
  const src = fs.readFileSync(
    path.join(root, "src/lib/settings-registry.ts"),
    "utf8",
  );
  return [...src.matchAll(/^  "([a-z][^"]+)": \{/gm)].map((match) => match[1]);
}

/** @returns {Map<string, string>} slug → documentTitle */
export function parseMarketingTitles() {
  const src = fs.readFileSync(
    path.join(root, "src/lib/marketing-pages.ts"),
    "utf8",
  );
  const titles = new Map();
  for (const match of src.matchAll(
    /slug:\s*"([^"]+)"[\s\S]*?documentTitle:\s*"([^"]+)"/g,
  )) {
    titles.set(match[1], match[2]);
  }
  return titles;
}

/**
 * Parse `href: "/campaigns/..."` entries from a nav routes file.
 * @param {string} fileName e.g. `campaigns-routes.ts`
 * @param {string} rootPath e.g. `/campaigns`
 */
export function parseAppNavRoutes(fileName, rootPath) {
  const src = fs.readFileSync(path.join(root, "src/lib", fileName), "utf8");
  const hrefs = [
    ...src.matchAll(/href:\s*"([^"]+)"/g),
    ...src.matchAll(/href:\s*app\w+Path\("([^"]+)"\)/g),
  ].map((match) => {
    const subpath = match[1];
    if (subpath.startsWith("/")) return subpath;
    return `${rootPath}/${subpath.replace(/^\//, "")}`;
  });
  const routes = new Set([rootPath, ...hrefs]);
  return [...routes].sort();
}

export function parseCampaignsRoutes() {
  return parseAppNavRoutes("campaigns-routes.ts", "/campaigns");
}

export function parseHelpdeskRoutes() {
  return parseAppNavRoutes("helpdesk-routes.ts", "/helpdesk");
}

export function parseAnalyticsRoutes() {
  return parseAppNavRoutes("analytics-routes.ts", "/analytics");
}
