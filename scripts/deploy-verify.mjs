#!/usr/bin/env node
/**
 * Pre-deploy verification: check + optional remote smoke.
 *
 * Usage:
 *   node scripts/deploy-verify.mjs
 *   node scripts/deploy-verify.mjs https://your-app.vercel.app
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deployUrl = process.argv[2]?.replace(/\/$/, "");

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, ...env },
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

console.log("=== Deploy verify: npm run check ===\n");
await run("npm", ["run", "check"]);

if (deployUrl) {
  console.log(`\n=== Remote smoke: ${deployUrl} ===\n`);
  await run("node", ["scripts/smoke-routes.mjs"], {
    SMOKE_BASE_URL: deployUrl,
  });
  console.log(`\nDeploy verify passed for ${deployUrl}`);
} else {
  console.log("\n=== Local smoke: npm run smoke ===\n");
  await run("npm", ["run", "smoke"]);
  console.log("\nDeploy verify passed (local).");
  console.log("After Vercel deploy, re-run:");
  console.log("  node scripts/deploy-verify.mjs https://your-app.vercel.app");
}
