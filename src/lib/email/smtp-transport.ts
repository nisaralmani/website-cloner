/**
 * SMTP outbound mail (ported from Ai Helpdesk smtp.ts).
 */
import nodemailer from "nodemailer";
import type { WorkspaceEmailConfig } from "@/lib/email/workspace-config";
import { getWorkspaceEmailConfigForWorkspace, isSmtpReady } from "@/lib/email/workspace-config";

export interface SmtpSendResult {
  sent: boolean;
  reason?: string;
  messageId?: string;
}

export interface OutboundMail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  references?: string[];
}

function transport(config: WorkspaceEmailConfig) {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.password },
    tls: { rejectUnauthorized: false },
  });
}

export async function isWorkspaceSmtpConfigured(workspaceId: string): Promise<boolean> {
  const config = await getWorkspaceEmailConfigForWorkspace(workspaceId);
  return isSmtpReady(config);
}

export async function sendMailSmtp(
  workspaceId: string,
  mail: OutboundMail,
): Promise<SmtpSendResult> {
  const config = await getWorkspaceEmailConfigForWorkspace(workspaceId);
  if (!isSmtpReady(config)) {
    return { sent: false, reason: "SMTP not configured" };
  }

  try {
    const info = await transport(config).sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      inReplyTo: mail.inReplyTo,
      references: mail.references?.length ? mail.references.join(" ") : undefined,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifySmtp(
  config: WorkspaceEmailConfig,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSmtpReady(config)) {
    return { ok: false, error: "Missing SMTP host/user/password/from" };
  }
  try {
    await transport(config).verify();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
