#!/usr/bin/env node
/**
 * Merge Ai Helpdesk env + production email config into chat .env.production.
 * Email IMAP/SMTP lives in bydesk Postgres (settings.email_config), not .env.
 *
 * Usage: node scripts/sync-helpdesk-env.mjs
 */
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const HELPDESK_ENV = process.env.HELPDESK_ENV_PATH || "D:/Ai Helpdesk/.env";
const ENC_PREFIX = "enc:v1:";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const vars = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function decryptSecret(stored, sessionSecret, salt) {
  if (!stored || !stored.startsWith(ENC_PREFIX)) return stored;
  const key = crypto.scryptSync(sessionSecret, salt, 32);
  const raw = Buffer.from(stored.slice(ENC_PREFIX.length), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

function fetchBydeskEmailConfig() {
  const vps = loadEnvFile(path.join(root, ".env.vps"));
  if (!vps.VPS_IP || !vps.VPS_SSH_KEY_PATH) {
    throw new Error("Missing .env.vps — cannot fetch bydesk email_config from VPS.");
  }
  const key = vps.VPS_SSH_KEY_PATH.replace(/\\/g, "/");
  const target = `${vps.VPS_USER || "sysadmin"}@${vps.VPS_IP}`;
  const sql = "SELECT value FROM settings WHERE key = 'email_config' LIMIT 1;";
  const cmd = `ssh -i "${key}" -o BatchMode=yes ${target} "PGPASSWORD=a2db9367326470f14d406bb1d046cb6c32a527117adceaf3 psql -h 127.0.0.1 -p 5433 -U bydesk_app -d bydesk -t -A -c \\"${sql}\\""`;
  const raw = execSync(cmd, { encoding: "utf8" }).trim();
  if (!raw) throw new Error("No email_config row in bydesk settings table.");
  return JSON.parse(raw);
}

function envLine(key, value) {
  if (/[\s#"'\\]/.test(value)) {
    return `${key}="${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return `${key}=${value}`;
}

function main() {
  const helpdesk = loadEnvFile(HELPDESK_ENV);
  const bydeskProd = (() => {
    try {
      const vps = loadEnvFile(path.join(root, ".env.vps"));
      const key = vps.VPS_SSH_KEY_PATH?.replace(/\\/g, "/");
      const target = `${vps.VPS_USER || "sysadmin"}@${vps.VPS_IP}`;
      const out = execSync(
        `ssh -i "${key}" -o BatchMode=yes ${target} "cat /var/www/bybelt/bydesk/.env"`,
        { encoding: "utf8" },
      );
      const vars = {};
      for (const line of out.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        let value = trimmed.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        vars[trimmed.slice(0, eq).trim()] = value;
      }
      return vars;
    } catch {
      return {};
    }
  })();

  const sessionSecret =
    bydeskProd.SESSION_SECRET || helpdesk.SESSION_SECRET || "";
  const emailConfig = fetchBydeskEmailConfig();
  const imapPass = decryptSecret(
    emailConfig.imap.password,
    sessionSecret,
    "bydesk-email-salt",
  );
  const smtpPass = decryptSecret(
    emailConfig.smtp.password,
    sessionSecret,
    "bydesk-email-salt",
  );

  const merged = {
    OPENAI_API_KEY: helpdesk.OPENAI_API_KEY || bydeskProd.OPENAI_API_KEY || "",
    OPENAI_MODEL: helpdesk.OPENAI_MODEL || bydeskProd.OPENAI_MODEL || "gpt-4o-mini",
    CRON_SECRET: bydeskProd.CRON_SECRET || helpdesk.CRON_SECRET || "",
    IMAP_HOST: emailConfig.imap.host,
    IMAP_PORT: String(emailConfig.imap.port),
    IMAP_SECURE: emailConfig.imap.secure ? "true" : "false",
    IMAP_USER: emailConfig.imap.user,
    IMAP_PASS: imapPass,
    SMTP_HOST: emailConfig.smtp.host,
    SMTP_PORT: String(emailConfig.smtp.port),
    SMTP_SECURE: emailConfig.smtp.secure ? "true" : "false",
    SMTP_USER: emailConfig.smtp.user,
    SMTP_PASS: smtpPass,
    SUPPORT_FROM_NAME: emailConfig.smtp.fromName,
    SUPPORT_FROM_EMAIL: emailConfig.smtp.fromEmail,
  };

  const prodPath = path.join(root, ".env.production");
  const existing = loadEnvFile(prodPath);
  const next = { ...existing, ...merged };
  const keys = Object.keys(next).sort((a, b) => {
    const core = [
      "NODE_ENV",
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_MARKETING_URL",
      "DATABASE_PATH",
      "SESSION_SECRET",
      "BYBELT_INTERNAL_SECRET",
      "SHOPIFY_PLUGIN_INTERNAL_URL",
      "HOSTNAME",
      "PORT",
      "NEXT_TELEMETRY_DISABLED",
    ];
    const ai = core.indexOf(a);
    const bi = core.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  const body = keys.map((k) => envLine(k, next[k])).join("\n") + "\n";
  writeFileSync(prodPath, body);
  console.log(`Updated ${prodPath} with helpdesk env (${Object.keys(merged).length} keys).`);
}

main();
