#!/usr/bin/env node

/**
 * Trigger the Shopify reconciliation job on the Shopify plugin app (Phase 20).
 * Usage: node scripts/shopify-reconcile-cron.mjs
 *
 * Verifies ShopLink consistency, webhook registration, workspace linkage, stale
 * sync state, and surfaces the bridge dead-letter backlog. Performs only safe,
 * idempotent repairs (webhook re-registration). Never overwrites merchant data.
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
  process.env.BYBELT_CRON_ENV_FILE?.trim() || path.join(process.cwd(), ".cron.env");
loadCronEnvFile(envFile);

// The reconciliation route lives on the Shopify plugin app (:3005), fronted by
// nginx under the /plugin/ prefix on chat.bybelt.com.
const base = (
  process.env.BYBELT_SHOPIFY_BASE_URL ??
  process.env.BYBELT_CRON_BASE_URL ??
  "https://chat.bybelt.com"
).replace(/\/$/, "");
const secret = process.env.BYBELT_INTERNAL_SECRET?.trim();

if (!secret) {
  console.error(
    "BYBELT_INTERNAL_SECRET is required (set env or use BYBELT_CRON_ENV_FILE).",
  );
  process.exit(1);
}

const response = await fetch(`${base}/plugin/shopify/internal/reconcile`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Bybelt-Internal-Secret": secret,
  },
  body: JSON.stringify({}),
});

const payload = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error("Shopify reconciliation failed:", response.status, payload);
  process.exit(1);
}

console.log(
  `Shopify reconciliation complete: ${payload.totalShops ?? 0} shop(s), ` +
    `${payload.repaired ?? 0} repaired, ${payload.needsReauthCount ?? 0} need re-auth, ` +
    `${payload.staleSyncCount ?? 0} stale, ${payload.deadLetterCount ?? 0} dead-letter(s).`,
);
if (Array.isArray(payload.shops)) {
  for (const shop of payload.shops) {
    if (shop.issues?.length) {
      console.log(`  ⚠ ${shop.shop}: ${shop.issues.join(", ")}`);
    }
  }
}
