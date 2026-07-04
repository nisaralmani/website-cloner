/**
 * Per-workspace IMAP/SMTP config (ported from Ai Helpdesk emailConfig.ts).
 * Passwords encrypted at rest; env vars used as fallback for single-tenant cron.
 */
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { getDb, selectOne } from "@/db/client";
import { workspaceSettings } from "@/db/schema";

export interface ImapSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export interface WorkspaceEmailConfig {
  enabled: boolean;
  imap: ImapSettings;
  smtp: SmtpSettings;
}

const CONFIG_KEY = "email/inbound::config";
const ENABLED_KEY = "email/inbound::enabled";
const ENC_PREFIX = "enc:v1:";

function encryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET || "bybelt-dev-secret-change-me";
  return crypto.scryptSync(secret, "bybelt-email-salt", 32);
}

export function encryptEmailSecret(plain: string): string {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENC_PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptEmailSecret(stored: string): string {
  if (!stored) return "";
  if (!stored.startsWith(ENC_PREFIX)) return stored;
  try {
    const raw = Buffer.from(stored.slice(ENC_PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

function envFallback(): WorkspaceEmailConfig {
  return {
    enabled: !!(process.env.IMAP_HOST && process.env.IMAP_USER),
    imap: {
      host: process.env.IMAP_HOST || "",
      port: Number(process.env.IMAP_PORT || 993),
      secure: (process.env.IMAP_SECURE ?? "true") !== "false",
      user: process.env.IMAP_USER || "",
      password: process.env.IMAP_PASS || "",
    },
    smtp: {
      host: process.env.SMTP_HOST || (process.env.IMAP_HOST || "").replace(/^imap\./i, "smtp."),
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE ?? "true") !== "false",
      user: process.env.SMTP_USER || process.env.IMAP_USER || "",
      password: process.env.SMTP_PASS || process.env.IMAP_PASS || "",
      fromName: process.env.SUPPORT_FROM_NAME || "Support",
      fromEmail:
        process.env.SUPPORT_FROM_EMAIL || process.env.SMTP_USER || process.env.IMAP_USER || "",
    },
  };
}

export function isImapReady(config: WorkspaceEmailConfig): boolean {
  return !!(config.imap.host && config.imap.user && config.imap.password);
}

export function isSmtpReady(config: WorkspaceEmailConfig): boolean {
  return !!(config.smtp.host && config.smtp.user && config.smtp.password && config.smtp.fromEmail);
}

export async function getWorkspaceEmailConfig(
  db: AppDatabase,
  workspaceId: string,
): Promise<WorkspaceEmailConfig> {
  const row = await selectOne(
    db
      .select({ value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, CONFIG_KEY),
        ),
      ),
  );

  if (!row?.value) {
    const fallback = envFallback();
    if (process.env.EMAIL_INGEST_WORKSPACE_ID === workspaceId) {
      return fallback;
    }
    return { ...fallback, enabled: false, imap: { ...fallback.imap, password: "" }, smtp: { ...fallback.smtp, password: "" } };
  }

  try {
    const parsed = JSON.parse(row.value) as WorkspaceEmailConfig;
    parsed.imap.password = decryptEmailSecret(parsed.imap.password);
    parsed.smtp.password = decryptEmailSecret(parsed.smtp.password);
    return parsed;
  } catch {
    return envFallback();
  }
}

export async function getWorkspaceEmailConfigForWorkspace(workspaceId: string) {
  const db = await getDb();
  return getWorkspaceEmailConfig(db, workspaceId);
}

export async function setWorkspaceEmailConfig(
  db: AppDatabase,
  workspaceId: string,
  input: WorkspaceEmailConfig,
): Promise<void> {
  const prev = await getWorkspaceEmailConfig(db, workspaceId).catch(() => null);
  const imapPass = input.imap.password || prev?.imap.password || "";
  const smtpPass = input.smtp.password || prev?.smtp.password || "";
  const toStore: WorkspaceEmailConfig = {
    enabled: input.enabled,
    imap: { ...input.imap, password: encryptEmailSecret(imapPass) },
    smtp: { ...input.smtp, password: encryptEmailSecret(smtpPass) },
  };

  const configExisting = await selectOne(
    db
      .select()
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, CONFIG_KEY),
        ),
      ),
  );

  if (configExisting) {
    await db
      .update(workspaceSettings)
      .set({ value: JSON.stringify(toStore) })
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, CONFIG_KEY),
        ),
      );
  } else {
    await db.insert(workspaceSettings).values({
      workspaceId,
      settingKey: CONFIG_KEY,
      value: JSON.stringify(toStore),
    });
  }

  const enabledExisting = await selectOne(
    db
      .select()
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, ENABLED_KEY),
        ),
      ),
  );

  if (enabledExisting) {
    await db
      .update(workspaceSettings)
      .set({ value: input.enabled ? "true" : "false" })
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          eq(workspaceSettings.settingKey, ENABLED_KEY),
        ),
      );
  } else {
    await db.insert(workspaceSettings).values({
      workspaceId,
      settingKey: ENABLED_KEY,
      value: input.enabled ? "true" : "false",
    });
  }
}

export async function getWorkspaceEmailConfigPublic(
  db: AppDatabase,
  workspaceId: string,
) {
  const config = await getWorkspaceEmailConfig(db, workspaceId);
  return {
    enabled: config.enabled,
    imap: {
      host: config.imap.host,
      port: config.imap.port,
      secure: config.imap.secure,
      user: config.imap.user,
      passwordSet: !!config.imap.password,
    },
    smtp: {
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      user: config.smtp.user,
      fromName: config.smtp.fromName,
      fromEmail: config.smtp.fromEmail,
      passwordSet: !!config.smtp.password,
    },
  };
}

export async function listEmailIngestWorkspaceIds(db: AppDatabase): Promise<string[]> {
  const envWorkspace = process.env.EMAIL_INGEST_WORKSPACE_ID?.trim();
  if (envWorkspace) {
    return [envWorkspace];
  }

  const rows = await db
    .select({ workspaceId: workspaceSettings.workspaceId, value: workspaceSettings.value })
    .from(workspaceSettings)
    .where(eq(workspaceSettings.settingKey, ENABLED_KEY));

  return rows.filter((row) => row.value === "true").map((row) => row.workspaceId);
}
