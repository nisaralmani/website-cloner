/**
 * Per-workspace IMAP/SMTP config. Backed by the same generic workspace
 * settings field storage the Settings -> Email Delivery UI writes to
 * (email/delivery::*), so a value a user saves there is exactly what gets
 * used to actually send/receive mail. Passwords are encrypted at rest (see
 * lib/settings/workspace-settings.ts); env vars remain a fallback for
 * single-tenant/cron deployments with no per-workspace config saved yet.
 */
import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { getDb } from "@/db/client";
import { workspaceSettings } from "@/db/schema";
import {
  loadWorkspaceSettingFields,
  saveWorkspaceSettingField,
} from "@/lib/settings/workspace-settings";
import {
  DEFAULT_SMTP_FIELDS,
  EMAIL_DELIVERY_PAGE_SLUG,
  isImplicitTlsPort,
  type SmtpFields,
} from "@/lib/email/smtp-preferences";
import { EMAIL_CUSTOM_SMTP_KEY, isCustomSmtpEnabled } from "@/lib/email/delivery-preferences";

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

function fieldsToConfig(fields: SmtpFields, enabled: boolean): WorkspaceEmailConfig {
  return {
    enabled,
    imap: {
      host: fields.imapHost.trim(),
      port: Number(fields.imapPort) || 993,
      secure: isImplicitTlsPort(fields.imapPort),
      user: fields.imapUser.trim(),
      password: fields.imapPassword,
    },
    smtp: {
      host: fields.smtpHost.trim(),
      port: Number(fields.smtpPort) || 587,
      secure: isImplicitTlsPort(fields.smtpPort),
      user: fields.smtpUser.trim(),
      password: fields.smtpPassword,
      fromName: fields.smtpFromName.trim(),
      fromEmail: fields.smtpFrom.trim(),
    },
  };
}

function hasAnyPerWorkspaceConfig(fields: SmtpFields): boolean {
  return Boolean(
    fields.smtpHost.trim() ||
      fields.smtpUser.trim() ||
      fields.imapHost.trim() ||
      fields.imapUser.trim(),
  );
}

export async function getWorkspaceEmailConfig(
  db: AppDatabase,
  workspaceId: string,
): Promise<WorkspaceEmailConfig> {
  const fields = await loadWorkspaceSettingFields(
    db,
    workspaceId,
    EMAIL_DELIVERY_PAGE_SLUG,
    DEFAULT_SMTP_FIELDS,
  );

  if (!hasAnyPerWorkspaceConfig(fields)) {
    const fallback = envFallback();
    if (process.env.EMAIL_INGEST_WORKSPACE_ID === workspaceId) {
      return fallback;
    }
    return {
      ...fallback,
      enabled: false,
      imap: { ...fallback.imap, password: "" },
      smtp: { ...fallback.smtp, password: "" },
    };
  }

  const enabled = await isCustomSmtpEnabled(db, workspaceId);
  return fieldsToConfig(fields, enabled);
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
  const fieldWrites: Array<[keyof SmtpFields, string]> = [
    ["smtpHost", input.smtp.host],
    ["smtpPort", String(input.smtp.port)],
    ["smtpUser", input.smtp.user],
    ["smtpFrom", input.smtp.fromEmail],
    ["smtpFromName", input.smtp.fromName],
    ["imapHost", input.imap.host],
    ["imapPort", String(input.imap.port)],
    ["imapUser", input.imap.user],
  ];
  if (input.smtp.password) fieldWrites.push(["smtpPassword", input.smtp.password]);
  if (input.imap.password) fieldWrites.push(["imapPassword", input.imap.password]);

  for (const [key, value] of fieldWrites) {
    await saveWorkspaceSettingField(db, workspaceId, EMAIL_DELIVERY_PAGE_SLUG, key, value);
  }

  await saveWorkspaceSettingField(
    db,
    workspaceId,
    EMAIL_DELIVERY_PAGE_SLUG,
    EMAIL_CUSTOM_SMTP_KEY,
    input.enabled ? "true" : "false",
  );
}

export async function getWorkspaceEmailConfigPublic(db: AppDatabase, workspaceId: string) {
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
  const ids = new Set<string>();

  const envWorkspace = process.env.EMAIL_INGEST_WORKSPACE_ID?.trim();
  if (envWorkspace) {
    ids.add(envWorkspace);
  }

  const enabledKey = `${EMAIL_DELIVERY_PAGE_SLUG}::${EMAIL_CUSTOM_SMTP_KEY}`;
  const rows = await db
    .select({ workspaceId: workspaceSettings.workspaceId, value: workspaceSettings.value })
    .from(workspaceSettings)
    .where(eq(workspaceSettings.settingKey, enabledKey));

  for (const row of rows) {
    if (row.value === "true") ids.add(row.workspaceId);
  }

  return Array.from(ids);
}
