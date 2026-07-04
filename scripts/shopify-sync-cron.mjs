#!/usr/bin/env node

/**
 * Trigger scheduled Shopify contact sync on the main Bybelt app.
 * Usage: node scripts/shopify-sync-cron.mjs
 *
 * Loads BYBELT_INTERNAL_SECRET from:
 * 1. process.env (if set)
 * 2. BYBELT_CRON_ENV_FILE or ./.cron.env
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadCronEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const envFile =
  process.env.BYBELT_CRON_ENV_FILE?.trim() ||
  path.join(process.cwd(), ".cron.env");
loadCronEnvFile(envFile);

const base = (process.env.BYBELT_CRON_BASE_URL ?? "https://chat.bybelt.com").replace(
  /\/$/,
  "",
);
const secret = process.env.BYBELT_INTERNAL_SECRET?.trim();

if (!secret) {
  console.error(
    "BYBELT_INTERNAL_SECRET is required (set env or use BYBELT_CRON_ENV_FILE).",
  );
  process.exit(1);
}

const response = await fetch(`${base}/api/integrations/shopify/sync/cron`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Bybelt-Internal-Secret": secret,
  },
  body: JSON.stringify({}),
});

const payload = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error("Shopify cron sync failed:", response.status, payload);
  process.exit(1);
}

console.log(
  `Shopify cron sync complete: ${payload.synced ?? 0}/${payload.workspaces ?? 0} workspace(s).`,
);
if (Array.isArray(payload.results)) {
  for (const item of payload.results) {
    if (item.ok) {
      console.log(
        `  ✓ ${item.workspaceId}: ${item.total ?? 0} customers (${item.created ?? 0} new, ${item.updated ?? 0} updated)`,
      );
    } else {
      console.log(`  ✗ ${item.workspaceId}: ${item.error ?? "failed"}`);
    }
  }
}
