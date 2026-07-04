#!/usr/bin/env node

/**
 * Fail if production UI/API trees import mock data modules.
 * Usage: node scripts/check-no-mock-runtime.mjs
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_ROOTS = [
  path.join(root, "src", "app"),
  path.join(root, "src", "components"),
];

const MOCK_IMPORT =
  /from\s+["']@\/lib\/mock-|from\s+["'][^"']*\/mock-(inbox|settings|analytics|billing)/;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) files.push(full);
  }
  return files;
}

function main() {
  const violations = [];

  for (const scanRoot of SCAN_ROOTS) {
    for (const file of walk(scanRoot)) {
      const content = readFileSync(file, "utf8");
      const match = content.match(MOCK_IMPORT);
      if (match) {
        violations.push(`${path.relative(root, file)}: ${match[0]}`);
      }
    }
  }

  if (violations.length > 0) {
    console.error("Mock runtime import check failed:\n");
    for (const line of violations) console.error(`  - ${line}`);
    process.exit(1);
  }

  console.log("Mock runtime import check passed.");
}

main();
