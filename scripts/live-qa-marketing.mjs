/**
 * Compare live crisp.chat marketing titles vs local registry.
 * Usage: node scripts/live-qa-marketing.mjs [localBase]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localBase = process.argv[2] ?? null;

const LIVE_SLUG_MAP = {
  "artificial-intelligence": "ai",
  "ticket-center": "ticket",
  "status-page": "status",
  "chat-sdk": "sdk",
};

function parsePagesFromRegistry() {
  const src = fs.readFileSync(
    path.join(root, "src/lib/marketing-pages.ts"),
    "utf8",
  );
  const pages = [];
  for (const match of src.matchAll(
    /slug:\s*"([^"]+)"[\s\S]*?documentTitle:\s*"([^"]+)"/g,
  )) {
    pages.push({ slug: match[1], documentTitle: match[2] });
  }
  return pages;
}

async function getTitle(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return { status: res.status, title: null };
  const html = await res.text();
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/&amp;/g, "&");
  return { status: res.status, title: title ?? null };
}

const pages = parsePagesFromRegistry();
const results = [];

for (const page of pages) {
  const liveSlug = LIVE_SLUG_MAP[page.slug] ?? page.slug;
  const liveUrl = `https://bybelt.com/en/${liveSlug}/`;
  const localUrl = localBase ? `${localBase}/en/${page.slug}` : null;

  const live = await getTitle(liveUrl);
  let local = null;
  if (localUrl) {
    local = await getTitle(localUrl);
  }

  const match =
    live.title && page.documentTitle && live.title === page.documentTitle;
  results.push({
    slug: page.slug,
    registry: page.documentTitle,
    live: live.title,
    liveStatus: live.status,
    local: local?.title ?? null,
    pass: match,
  });
}

console.log("Live title QA (crisp.chat vs marketing-pages.ts)\n");
let passed = 0;
for (const row of results) {
  const icon = row.pass ? "PASS" : row.liveStatus === 404 ? "SKIP" : "DIFF";
  if (row.pass) passed += 1;
  console.log(`${icon} /en/${row.slug}`);
  if (!row.pass) {
    console.log(`  registry: ${row.registry}`);
    console.log(`  live:     ${row.live ?? `(HTTP ${row.liveStatus})`}`);
  }
  if (row.local) {
    console.log(`  local:    ${row.local}`);
  }
}

const homepage = await getTitle("https://bybelt.com/en/");
const localHome = localBase ? await getTitle(`${localBase}/en`) : null;
console.log(`\n/en homepage live: ${homepage.title}`);
if (localHome) console.log(`/en homepage local: ${localHome.title}`);

console.log(`\n${passed}/${results.length} registry titles match live.`);
