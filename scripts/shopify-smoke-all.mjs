#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const vars = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const smokeEnv = {
  ...process.env,
  ...loadEnvFile(path.join(root, ".env.production")),
  ...loadEnvFile(path.join(root, "shopify-app", "chat", ".env.production")),
  SHOPIFY_SMOKE_WORKSPACE_ID:
    process.env.SHOPIFY_SMOKE_WORKSPACE_ID ?? "e3f25f9d-fd3d-440a-93f1-f3ef0c5db653",
};

const steps = [
  { name: "stack", command: "node", args: ["scripts/shopify-stack-smoke.mjs"] },
  { name: "api", command: "node", args: ["scripts/shopify-api-smoke.mjs"] },
];

let failed = 0;

for (const step of steps) {
  console.log(`\n== Shopify smoke: ${step.name} ==`);
  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    env: smokeEnv,
  });
  if (result.status !== 0) failed += 1;
}

if (failed > 0) {
  process.exitCode = 1;
  console.error(`\n${failed} Shopify smoke suite(s) failed.`);
} else {
  console.log("\nAll Shopify smoke suites passed.");
}
