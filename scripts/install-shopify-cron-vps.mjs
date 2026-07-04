#!/usr/bin/env node

/**
 * Install a daily Shopify contact-sync cron on the VPS (sysadmin).
 * Secrets are stored in .cron.env on the server (chmod 600), not in crontab.
 * Usage: node scripts/install-shopify-cron-vps.mjs
 */

import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile, loadEnvVps } from "./lib/load-env-file.mjs";
import { resolveInternalSecret } from "./lib/internal-secret.mjs";
import { scp, ssh } from "./lib/vps-ssh.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function main() {
  const vps = loadEnvVps(root);
  const existingProdEnv = loadEnvFile(path.join(root, ".env.production"));
  const shopifyProdEnv = loadEnvFile(path.join(root, "shopify-app", "chat", ".env.production"));
  const secret = resolveInternalSecret([vps, shopifyProdEnv, existingProdEnv], {
    required: true,
  });

  const user = vps.VPS_USER?.trim() || "sysadmin";
  const cronBase = vps.BYBELT_CRON_BASE_URL?.trim() || "https://chat.bybelt.com";
  const remoteChat = `${vps.VPS_REMOTE_WWW_DIR?.trim() || `/home/${user}`}/chat`;
  const cronEnvPath = `${remoteChat}/.cron.env`;

  const cronEnvBody = [
    "# Managed by scripts/install-shopify-cron-vps.mjs — chmod 600",
    `BYBELT_INTERNAL_SECRET=${secret}`,
    `BYBELT_CRON_BASE_URL=${cronBase}`,
    "",
  ].join("\n");

  const cronLine = `15 3 * * * cd ${remoteChat} && BYBELT_CRON_ENV_FILE=${cronEnvPath} /usr/bin/node scripts/shopify-sync-cron.mjs >> ${remoteChat}/logs/shopify-cron.log 2>&1`;

  const installScript = `#!/bin/bash
set -euo pipefail
mkdir -p "${remoteChat}/logs"
( crontab -l 2>/dev/null | grep -v shopify-sync-cron.mjs || true; printf '%s\\n' '${cronLine.replace(/'/g, `'\\''`)}' ) | crontab -
crontab -l | grep shopify-sync-cron || true
`;

  const tmpDir = mkdtempSync(path.join(tmpdir(), "bybelt-cron-"));
  const localCronEnv = path.join(tmpDir, ".cron.env");
  const localInstallScript = path.join(tmpDir, "install-cron.sh");
  writeFileSync(localCronEnv, cronEnvBody, { mode: 0o600 });
  writeFileSync(localInstallScript, installScript, { mode: 0o755 });

  try {
    console.log(`Installing Shopify sync cron on ${user}@${vps.VPS_IP}…`);
    scp(vps, localCronEnv, cronEnvPath, { cwd: root });
    scp(vps, localInstallScript, "/tmp/bybelt-install-cron.sh", { cwd: root });
    ssh(vps, `chmod 600 ${cronEnvPath} && bash /tmp/bybelt-install-cron.sh && rm -f /tmp/bybelt-install-cron.sh`, {
      cwd: root,
    });
    console.log("Done. Cron runs daily at 03:15 UTC.");
    console.log(`Cron env file: ${cronEnvPath} (not visible in crontab).`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();
