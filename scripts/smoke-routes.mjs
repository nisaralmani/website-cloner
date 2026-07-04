import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  parseAnalyticsRoutes,
  parseCampaignsRoutes,
  parseHelpdeskRoutes,
  parseMarketingTitles,
  parseSettingsSlugs,
} from "./smoke-registry.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.listen(0, () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
    probe.on("error", reject);
  });
}

const externalBase = process.env.SMOKE_BASE_URL?.replace(/\/$/, "");
const PORT = externalBase ? null : await getFreePort();
const BASE = externalBase ?? `http://127.0.0.1:${PORT}`;

const marketingTitles = parseMarketingTitles();

/** Core app routes (inbox areas without catch-all sub-nav). */
const CORE_APP_ROUTES = [
  "/",
  "/initiate/login",
  "/initiate/forgot",
  "/initiate/reset?token=smoke",
  "/agent",
  "/visitors",
  "/contacts",
  "/plugins",
  "/settings",
];

const CAMPAIGNS_ROUTES = parseCampaignsRoutes();
const HELPDESK_ROUTES = parseHelpdeskRoutes();
const ANALYTICS_ROUTES = parseAnalyticsRoutes();
const SETTINGS_ROUTES = parseSettingsSlugs().map((slug) => `/settings/${slug}`);

const APP_ROUTES = [
  ...CORE_APP_ROUTES,
  ...CAMPAIGNS_ROUTES,
  ...HELPDESK_ROUTES,
  ...ANALYTICS_ROUTES,
  ...SETTINGS_ROUTES,
];

/** Routes that must return 404 with branded body */
const NOT_FOUND_ROUTES = [
  { path: "/__smoke-not-found__", mustInclude: "Page not found" },
];

const SEO_ROUTES = [
  "/robots.txt",
  "/sitemap.xml",
  "/seo/site.webmanifest",
  "/seo/favicon.ico",
];

/**
 * All 18 marketing sub-routes + homepage.
 * `mustInclude` — substring expected in rendered HTML (from live page copy).
 */
const MARKETING_ROUTES = [
  {
    path: "/",
    mustInclude: "Support every customer",
    documentTitle: "Bybelt — AI Customer Support Platform",
    marketingHost: true,
  },
  { path: "/pricing", mustInclude: "Compare our plans", slug: "pricing", marketingHost: true },
  { path: "/ai-agent", mustInclude: "Build your perfect AI Agent", slug: "ai-agent", marketingHost: true },
  { path: "/apps", mustInclude: "customer service app for mobile", slug: "apps", marketingHost: true },
  {
    path: "/integrations",
    mustInclude: "Popular integrations",
    slug: "integrations",
    marketingHost: true,
  },
  { path: "/hugo", mustInclude: "Meet Hugo", slug: "hugo", marketingHost: true },
  { path: "/signup", mustInclude: "Create your workspace", slug: "signup", marketingHost: true },
  { path: "/unleash", mustInclude: "Discover what's next for Bybelt", slug: "unleash", marketingHost: true },
  { path: "/livechat", mustInclude: "Get started free", slug: "livechat", marketingHost: true },
  { path: "/chatbot", mustInclude: "Build my chatbot", slug: "chatbot", marketingHost: true },
  { path: "/crm", mustInclude: "Enhance your customer experience", slug: "crm", marketingHost: true },
  {
    path: "/shared-inbox",
    mustInclude: "shared inbox to bring seamless collaboration",
    slug: "shared-inbox",
    marketingHost: true,
  },
  {
    path: "/artificial-intelligence",
    mustInclude: "Artificial intelligence made to support",
    slug: "artificial-intelligence",
    marketingHost: true,
  },
  { path: "/en/campaigns", mustInclude: "Build journeys that drive", slug: "campaigns", marketingHost: true },
  { path: "/en/analytics", mustInclude: "Turn support data into growth levers", slug: "analytics", marketingHost: true },
  {
    path: "/knowledge",
    mustInclude: "help themselves with a knowledge base",
    slug: "knowledge",
    marketingHost: true,
  },
  {
    path: "/ticket-center",
    mustInclude: "Resolve issues without creating tickets",
    slug: "ticket-center",
    marketingHost: true,
  },
  { path: "/status-page", mustInclude: "Total outage", slug: "status-page", marketingHost: true },
  { path: "/chat-sdk", mustInclude: "Infrastructure and tools to empower", slug: "chat-sdk", marketingHost: true },
  { path: "/help-center", mustInclude: "Popular help articles", helpHost: true },
  { path: "/developer-docs", mustInclude: "Developer Hub", docsHost: true },
  {
    path: "/system-status",
    mustInclude: "All systems operational",
    statusHost: true,
    documentTitle: "System Status | Bybelt",
  },
].map((route) => ({
  ...route,
  documentTitle:
    route.documentTitle ??
    (route.slug ? marketingTitles.get(route.slug) : undefined),
}));

const ROUTES = [
  ...APP_ROUTES,
  ...NOT_FOUND_ROUTES.map((r) => r.path),
  ...SEO_ROUTES,
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(maxAttempts = 40) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/`);
      if (response.ok) {
        await wait(1500);
        return;
      }
    } catch {
      // server not ready
    }
    await wait(500);
  }
  throw new Error(`Server did not become ready on port ${PORT}`);
}

/** Pre-compile lazy app routes before assertions (avoids cold-start HTML shells). */
async function warmUpServer() {
  const warmChecks = [
    { route: "/campaigns", mustInclude: "Campaigns" },
    { route: "/helpdesk", mustInclude: "Knowledge Base" },
    { route: "/analytics", mustInclude: "Analytics" },
    { route: "/settings/account/information", mustInclude: "Settings" },
  ];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    let ready = true;
    for (const { route, mustInclude } of warmChecks) {
      try {
        const response = await fetch(`${BASE}${route}`);
        const html = await response.text();
        if (!response.ok || !html.includes(mustInclude)) {
          ready = false;
        }
      } catch {
        ready = false;
      }
    }
    if (ready) return;
    await wait(750);
  }

  throw new Error("Server warmup failed — app routes did not render expected markup");
}

function extractDocumentTitle(html) {
  return html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/&amp;/g, "&") ?? null;
}

function findMarketingRoute(route, host) {
  if (!host) return undefined;
  if (host === "help.bybelt.com") {
    return MARKETING_ROUTES.find((entry) => entry.helpHost && entry.path === route);
  }
  if (host === "docs.bybelt.com") {
    return MARKETING_ROUTES.find((entry) => entry.docsHost && entry.path === route);
  }
  if (host === "status.bybelt.com") {
    return MARKETING_ROUTES.find((entry) => entry.statusHost && entry.path === route);
  }
  if (host === "www.bybelt.com") {
    return MARKETING_ROUTES.find((entry) => entry.marketingHost && entry.path === route);
  }
  return undefined;
}

async function smokeRoute(route, host) {
  const notFound = NOT_FOUND_ROUTES.find((r) => r.path === route);
  const headers = host
    ? {
        Host: PORT ? `${host}:${PORT}` : host,
        "X-Forwarded-Host": host,
      }
    : undefined;
  const response = await fetch(`${BASE}${route}`, { redirect: "follow", headers });
  if (notFound) {
    if (response.status !== 404) {
      throw new Error(`${route} expected 404, got ${response.status}`);
    }
    const html = await response.text();
    if (!html.includes(notFound.mustInclude)) {
      throw new Error(`${route} missing branded 404 copy: "${notFound.mustInclude}"`);
    }
    return response.status;
  }

  if (!response.ok) {
    throw new Error(`${route} returned ${response.status}`);
  }
  const html = await response.text();
  if (
    route !== "/robots.txt" &&
    route !== "/seo/site.webmanifest" &&
    route !== "/seo/favicon.ico" &&
    html.length < 200
  ) {
    throw new Error(`${route} returned suspiciously small body (${html.length} bytes)`);
  }

  if (route === "/sitemap.xml") {
    const expectedMarketing = MARKETING_ROUTES.length;
    const urlCount = (html.match(/<url>/g) ?? []).length;
    if (!html.includes("<urlset") || urlCount < expectedMarketing) {
      throw new Error(
        `${route} expected ≥${expectedMarketing} URLs, found ${urlCount}`,
      );
    }
    for (const {
      path: marketingPath,
      slug: marketingSlug,
      marketingHost,
      helpHost,
      docsHost,
      statusHost,
    } of MARKETING_ROUTES) {
      if (statusHost) continue;
      const slug = marketingPath === "/" ? "" : marketingPath;
      const expected = helpHost
        ? "help.bybelt.com"
        : docsHost
          ? "docs.bybelt.com"
          : marketingHost
            ? marketingSlug
              ? `www.bybelt.com/${marketingSlug}`
              : "www.bybelt.com"
            : null;
      if (!expected) continue;
      if (!html.includes(expected)) {
        throw new Error(`${route} missing sitemap entry for ${expected}`);
      }
    }
    for (const origin of ["help.bybelt.com", "docs.bybelt.com", "status.bybelt.com"]) {
      if (!html.includes(origin)) {
        throw new Error(`${route} missing sitemap entry for ${origin}`);
      }
    }
    return response.status;
  }

  if (route === "/robots.txt") {
    if (!html.toLowerCase().includes("sitemap")) {
      throw new Error(`${route} missing sitemap reference`);
    }
    return response.status;
  }

  if (route === "/seo/site.webmanifest") {
    if (!html.includes('"name": "Bybelt"') && !html.includes('"name":"Bybelt"')) {
      throw new Error(`${route} missing Bybelt app name`);
    }
    if (!html.includes('"start_url": "/"') && !html.includes('"start_url":"/"')) {
      throw new Error(`${route} missing start_url /`);
    }
    return response.status;
  }

  if (route === "/seo/favicon.ico") {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("image")) {
      throw new Error(`${route} expected image content-type, got ${contentType}`);
    }
    return response.status;
  }

  if (route.startsWith("/") && host === "www.bybelt.com" && route === "/") {
    if (!html.includes("og:image") && !html.includes("twitter:image")) {
      throw new Error(`${route} missing Open Graph image meta`);
    }
  }

  if (route === "/initiate/login" || route === "/initiate/forgot" || route.startsWith("/initiate/reset")) {
    if (!html.includes("<title>Bybelt</title>")) {
      throw new Error(`${route} expected document title "Bybelt"`);
    }
  }

  if (route.startsWith("/settings/")) {
    if (!html.includes("Settings")) {
      throw new Error(`${route} missing Settings shell markup`);
    }
  }

  if (route.startsWith("/campaigns")) {
    if (!html.includes("Campaigns")) {
      throw new Error(
        `${route} missing Campaigns panel markup (len=${html.length}, title=${extractDocumentTitle(html) ?? "none"})`,
      );
    }
  }

  if (route.startsWith("/helpdesk")) {
    const hasHelpdeskMarkup =
      html.includes("Helpdesk") ||
      html.includes("Articles") ||
      html.includes("Knowledge Base");
    if (!hasHelpdeskMarkup) {
      throw new Error(
        `${route} missing Helpdesk panel markup (len=${html.length}, title=${extractDocumentTitle(html) ?? "none"})`,
      );
    }
  }

  if (route.startsWith("/analytics")) {
    if (!html.includes("Analytics")) {
      throw new Error(`${route} missing Analytics panel markup`);
    }
  }

  const marketing = findMarketingRoute(route, host);
  if (marketing) {
    if (marketing.mustInclude && !html.includes(marketing.mustInclude)) {
      throw new Error(
        `${route} missing expected content: "${marketing.mustInclude}"`,
      );
    }
    if (marketing.documentTitle) {
      const title = extractDocumentTitle(html);
      if (title !== marketing.documentTitle) {
        throw new Error(
          `${route} title mismatch: expected "${marketing.documentTitle}", got "${title}"`,
        );
      }
    }
  }

  if (host === "www.bybelt.com" && route !== "/" && !html.includes("Bybelt")) {
    throw new Error(`${route} missing Bybelt branding in HTML`);
  }

  return response.status;
}

let server = null;
if (!externalBase) {
  server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATABASE_PATH: process.env.DATABASE_PATH ?? path.join(root, "data", "bybelt.db"),
      SMOKE_BYPASS_AUTH: "1",
      SESSION_SECRET: process.env.SESSION_SECRET ?? "smoke-test-secret",
      EMAIL_VERIFICATION_DEBUG: "1",
    },
  });
}

let failed = false;

try {
  if (!externalBase) {
    await waitForServer();
    await warmUpServer();
  }

  const results = [];
  for (const route of ROUTES) {
    const status = await smokeRoute(route);
    results.push({ route, status });
    console.log(`PASS ${route} (${status})`);
  }

  for (const marketing of MARKETING_ROUTES) {
    const host = marketing.helpHost
      ? "help.bybelt.com"
      : marketing.docsHost
        ? "docs.bybelt.com"
        : marketing.statusHost
          ? "status.bybelt.com"
          : "www.bybelt.com";
    const path = marketing.path;
    const status = await smokeRoute(path, host);
    results.push({ route: `${host}${path}`, status });
    console.log(`PASS ${host}${path} (${status})`);
  }

  const publicHelp = await fetch(`${BASE}/api/helpdesk/public?domain=fashionsis.com`);
  if (publicHelp.ok) {
    const payload = await publicHelp.json();
    const articleId = payload.articles?.[0]?.id;
    if (articleId) {
      const articlePath = `/article/${articleId}`;
      const status = await smokeRoute(articlePath, "help.bybelt.com");
      results.push({ route: `help.bybelt.com${articlePath}`, status });
      console.log(`PASS help.bybelt.com${articlePath} (${status})`);
    }
  }

  console.log(`\nSmoke test passed: ${results.length} routes.`);
  console.log(
    `  Core: ${CORE_APP_ROUTES.length} | Campaigns: ${CAMPAIGNS_ROUTES.length} | Helpdesk: ${HELPDESK_ROUTES.length} | Analytics: ${ANALYTICS_ROUTES.length} | Settings: ${SETTINGS_ROUTES.length} | Marketing: ${MARKETING_ROUTES.length} | SEO: ${SEO_ROUTES.length}`,
  );
  if (externalBase) {
    console.log(`  Base: ${externalBase}`);
  }

  if (process.env.SMOKE_SKIP_API !== "1") {
    console.log("\n=== API smoke ===\n");
    const { runApiSmoke } = await import("./smoke-api-tests.mjs");
    await runApiSmoke(BASE);
  }
} catch (error) {
  failed = true;
  console.error(`\nSmoke test failed: ${error instanceof Error ? error.message : error}`);
} finally {
  if (server) {
    server.kill("SIGTERM");
    await wait(300);
  }
}

process.exit(failed ? 1 : 0);
