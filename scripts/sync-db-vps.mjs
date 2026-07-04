#!/usr/bin/env node

/**
 * One-off: upload local SQLite DB to the VPS (overwrites production data).
 * Usage: node scripts/sync-db-vps.mjs
 *
 * Requires DEPLOY_SYNC_DB_CONFIRM=1 to run (safety gate).
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvVps } from "./lib/load-env-file.mjs";
import { scp, ssh } from "./lib/vps-ssh.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const appDir = "chat";
const dbPath = path.join(root, "data", "bybelt.db");

function main() {
  if (process.env.DEPLOY_SYNC_DB_CONFIRM !== "1") {
    console.error(
      "Refusing to overwrite production DB without DEPLOY_SYNC_DB_CONFIRM=1.",
    );
    console.error("Example: DEPLOY_SYNC_DB_CONFIRM=1 npm run sync:db:vps");
    process.exit(1);
  }

  if (!existsSync(dbPath)) {
    console.error(`Missing local database at ${dbPath}. Run npm run db:seed first.`);
    process.exit(1);
  }

  const vps = loadEnvVps(root);
  const remoteBase = `${vps.VPS_REMOTE_WWW_DIR}/${appDir}`;

  console.warn("WARNING: This will overwrite production SQLite at:");
  console.warn(`  ${remoteBase}/data/bybelt.db`);

  ssh(vps, `mkdir -p ${remoteBase}/data`, { cwd: root });
  scp(vps, dbPath, `${remoteBase}/data/bybelt.db`, { cwd: root });

  console.log("Database uploaded. Restart the app container if needed:");
  console.log(`  ssh ${vps.VPS_USER}@${vps.VPS_IP}`);
  console.log(`  cd ${remoteBase} && docker compose -f docker-compose.prod.yml up -d`);
}

main();
