#!/usr/bin/env node

/**
 * Fail CI if tracked files contain production secrets or env artifacts.
 * Usage: node scripts/check-tracked-secrets.mjs
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PLACEHOLDER =
  /^(change-me|your_|shpss_your|ci-smoke|smoke-test|example|placeholder|xxx+|ci-smoke-secret)$/i;

const BLOCKED_TRACKED_FILES = [
  ".env",
  ".env.production",
  ".env.vps",
  "shopify-app/chat/.env",
  "shopify-app/chat/.env.production",
];

const SENSITIVE_PATTERNS = [
  { name: "Shopify secret key", regex: /shpss_[a-f0-9]{32}/i },
  {
    name: "SESSION_SECRET assignment",
    regex: /SESSION_SECRET=(?!change-me)[^\s#]{12,}/,
  },
  {
    name: "BYBELT_INTERNAL_SECRET assignment",
    regex: /BYBELT_INTERNAL_SECRET=(?!$)[^\s#]{16,}/,
  },
  { name: "SEED_USER_PASSWORD in env", regex: /SEED_USER_PASSWORD=[^\s#]+/ },
];

function trackedFiles() {
  const output = execSync("git ls-files -z", { encoding: "utf8" });
  return output.split("\0").filter(Boolean);
}

function main() {
  const files = trackedFiles();
  const errors = [];

  for (const blocked of BLOCKED_TRACKED_FILES) {
    if (files.includes(blocked)) {
      errors.push(`Tracked env file must not be committed: ${blocked}`);
    }
  }

  for (const file of files) {
    if (!/\.(ts|tsx|js|mjs|json|md|yml|yaml|conf|sh|env\.example)$/i.test(file)) {
      continue;
    }
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }

    for (const { name, regex } of SENSITIVE_PATTERNS) {
      const match = content.match(regex);
      if (!match) continue;
      const value = match[0].split("=").pop()?.trim() ?? match[0];
      if (PLACEHOLDER.test(value)) continue;
      if (file.endsWith(".env.example") || file.endsWith(".env.vps.example")) continue;
      if (file.includes("check-tracked-secrets")) continue;
      errors.push(`${file}: possible ${name} (${match[0].slice(0, 40)}…)`);
    }
  }

  if (errors.length > 0) {
    console.error("Secret hygiene check failed:\n");
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log("Secret hygiene check passed.");
}

main();
