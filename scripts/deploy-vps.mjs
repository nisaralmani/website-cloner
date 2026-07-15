#!/usr/bin/env node

/**

 * Deploy Bybelt to Contabo VPS (reads .env.vps).

 * Serves: chat.bybelt.com (app), www.bybelt.com (marketing), help/docs subdomains.

 * Usage: node scripts/deploy-vps.mjs

 */

import { execSync } from "node:child_process";

import { existsSync, readFileSync, writeFileSync } from "node:fs";

import path from "node:path";

import { fileURLToPath } from "node:url";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.resolve(__dirname, "..");

const appDir = "chat";

const appPort = 3004;



import { installChatNginxSite } from "./lib/nginx-chat-site.mjs";
import { resolveInternalSecret } from "./lib/internal-secret.mjs";
import { resolveSessionSecret } from "./lib/session-secret.mjs";



const NGINX_SITES = [

  {

    domain: "chat.bybelt.com",

    conf: "chat.bybelt.com.conf",

    certName: "chat.bybelt.com",

    certDomains: ["chat.bybelt.com"],

  },

  {

    domain: "www.bybelt.com",

    conf: "www.bybelt.com.conf",

    certName: "www.bybelt.com",

    certDomains: ["www.bybelt.com", "bybelt.com"],

  },

  {

    domain: "help.bybelt.com",

    conf: "help.bybelt.com.conf",

    certName: "help.bybelt.com",

    certDomains: ["help.bybelt.com"],

  },

  {

    domain: "docs.bybelt.com",

    conf: "docs.bybelt.com.conf",

    certName: "docs.bybelt.com",

    certDomains: ["docs.bybelt.com"],

  },

  {

    domain: "status.bybelt.com",

    conf: "status.bybelt.com.conf",

    certName: "status.bybelt.com",

    certDomains: ["status.bybelt.com"],

  },

];



function loadEnvVps() {

  const envPath = path.join(root, ".env.vps");

  if (!existsSync(envPath)) {

    throw new Error("Missing .env.vps — add VPS connection details first.");

  }

  const vars = {};

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {

    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");

    if (eq === -1) continue;

    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();

  }

  return vars;

}



function sh(cmd, opts = {}) {

  console.log(`\n$ ${cmd}`);

  execSync(cmd, { stdio: "inherit", cwd: root, ...opts });

}



function ssh(vps, remoteCmd) {

  const key = vps.VPS_SSH_KEY_PATH.replace(/\\/g, "/");

  const target = `${vps.VPS_USER}@${vps.VPS_IP}`;

  sh(

    `ssh -i "${key}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new ${target} "${remoteCmd.replace(/"/g, '\\"')}"`,

  );

}



function scp(vps, local, remote) {

  const key = vps.VPS_SSH_KEY_PATH.replace(/\\/g, "/");

  const target = `${vps.VPS_USER}@${vps.VPS_IP}`;

  sh(`scp -i "${key}" -o BatchMode=yes "${local}" ${target}:${remote}`);

}



function setupNginxSite(vps, remoteBase, site) {
  if (site.domain === "chat.bybelt.com") {
    const confSrc = `${remoteBase}/deploy/nginx/${site.conf}`;
    installChatNginxSite(vps, confSrc, ssh);
    return;
  }

  const confSrc = `${remoteBase}/deploy/nginx/${site.conf}`;
  const avail = `/etc/nginx/sites-available/${site.domain}.conf`;
  const enabled = `/etc/nginx/sites-enabled/${site.domain}`;
  ssh(
    vps,
    `sudo cp ${confSrc} ${avail} && sudo ln -sf ${avail} ${enabled} && sudo nginx -t && sudo systemctl reload nginx`,
  );
}



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

function main() {

  const vps = loadEnvVps();

  const remoteBase = `${vps.VPS_REMOTE_WWW_DIR}/${appDir}`;

  const tarball = path.join(root, "deploy-chat.tar.gz");

  console.log(`Deploying Bybelt stack → ${remoteBase} (port ${appPort})`);

  console.log("Domains: chat.bybelt.com, www.bybelt.com, help.bybelt.com, docs.bybelt.com, status.bybelt.com");

  const existingProdEnv = loadEnvFile(path.join(root, ".env.production"));
  const sessionSecret = resolveSessionSecret([vps, existingProdEnv], { required: true });
  const shopifyProdEnv = loadEnvFile(path.join(root, "shopify-app", "chat", ".env.production"));
  const internalSecret = resolveInternalSecret([vps, shopifyProdEnv, existingProdEnv], {
    required: true,
  });

  const managedKeys = new Set([
    "NODE_ENV",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_MARKETING_URL",
    "DATABASE_PATH",
    "ALLOW_SQLITE_IN_PRODUCTION",
    "SESSION_SECRET",
    "BYBELT_INTERNAL_SECRET",
    "SHOPIFY_PLUGIN_INTERNAL_URL",
    "HOSTNAME",
    "PORT",
    "NEXT_TELEMETRY_DISABLED",
  ]);

  const coreEnv = {
    NODE_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://chat.bybelt.com",
    NEXT_PUBLIC_APP_URL: "https://chat.bybelt.com",
    NEXT_PUBLIC_MARKETING_URL: "https://www.bybelt.com",
    DATABASE_PATH: "/app/data/bybelt.db",
    // Explicit, non-silent opt-in: production runs on single-instance SQLite by
    // deliberate choice (the sanctioned pilot posture). Startup validation
    // honors this flag + DATABASE_PATH; without it, prod fails fast and demands
    // a PostgreSQL DATABASE_URL. See docs/DEPLOY.md ("Production database").
    ALLOW_SQLITE_IN_PRODUCTION: "true",
    SESSION_SECRET: sessionSecret,
    BYBELT_INTERNAL_SECRET: internalSecret,
    SHOPIFY_PLUGIN_INTERNAL_URL: "http://bybelt-shopify-chat:3000",
    HOSTNAME: "0.0.0.0",
    PORT: "3000",
    NEXT_TELEMETRY_DISABLED: "1",
  };

  const mergedProdEnv = { ...existingProdEnv, ...coreEnv };
  const extraKeys = Object.keys(mergedProdEnv)
    .filter((key) => !managedKeys.has(key))
    .sort();

  const prodEnv =
    `# Generated by scripts/deploy-vps.mjs — do not commit\n\n` +
    [...managedKeys].map((key) => `${key}=${mergedProdEnv[key]}`).join("\n") +
    (extraKeys.length
      ? `\n\n# Synced from Ai Helpdesk (scripts/sync-helpdesk-env.mjs)\n${extraKeys.map((key) => `${key}=${mergedProdEnv[key]}`).join("\n")}\n`
      : "\n");

  writeFileSync(path.join(root, ".env.production"), prodEnv);



  console.log("Creating deployment archive…");

  if (existsSync(tarball)) {

    execSync(`del /f /q "${tarball}"`, { stdio: "ignore", shell: true });

  }

  const tarCmd =
    `tar --exclude=node_modules --exclude=.git --exclude=.next --exclude=deploy-chat.tar.gz --exclude=.cursor --exclude=agent-transcripts` +
    ` --exclude=./.env --exclude=./.env.local --exclude=./.env.vps --exclude=./.env.development.local` +
    ` --exclude=./.env.test.local --exclude=./.env.production.local --exclude=./.env.txt` +
    // The production SQLite DB lives only on the VPS (bind-mounted via
    // docker-compose's `./data:/app/data`) and must never be touched by an
    // app-code deploy. Packaging the local dev copy here would silently
    // overwrite the live database on extraction — exclude the whole
    // directory, not just the known filename, so a renamed/added local file
    // can't reintroduce this.
    ` --exclude=./data --exclude=./scripts/decrypted-email-env.json -czf deploy-chat.tar.gz .`;
  console.log(`\n$ ${tarCmd}`);
  try {
    execSync(tarCmd, { cwd: root, shell: true, stdio: ["ignore", "inherit", "pipe"] });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : "";
    if (err.status === 1 && /file changed as we read it/.test(stderr)) {
      console.warn(
        "tar: benign 'file changed as we read it' warning (archive file's own directory mtime changed mid-read) — continuing.",
      );
    } else {
      if (stderr) console.error(stderr);
      throw err;
    }
  }



  ssh(vps, `mkdir -p ${remoteBase}/data ${remoteBase}/deploy/nginx`);

  scp(vps, tarball, `${remoteBase}/deploy-chat.tar.gz`);

  console.log("Skipping database upload (use npm run sync:db:vps for intentional DB sync).");

  scp(
    vps,
    path.join(root, "deploy", "nginx", "chat.bybelt.com.conf"),
    `${remoteBase}/deploy/nginx/chat.bybelt.com.conf`,
  );



  ssh(

    vps,

    `cd ${remoteBase} && tar -xzf deploy-chat.tar.gz && rm deploy-chat.tar.gz && docker compose -f docker-compose.prod.yml up -d --build`,

  );



  for (const site of NGINX_SITES) {

    console.log(`\nConfiguring nginx + SSL for ${site.domain}…`);

    setupNginxSite(vps, remoteBase, site);

  }



  ssh(vps, "sudo nginx -t && sudo systemctl reload nginx");



  console.log("\nDeployed successfully:");

  console.log("  Marketing: https://www.bybelt.com");

  console.log("  App:       https://chat.bybelt.com");

  console.log("  Help:      https://help.bybelt.com");

  console.log("  Docs:      https://docs.bybelt.com");
  console.log("  Status:    https://status.bybelt.com");

}



main();


