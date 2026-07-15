import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { verifyImap } from "@/lib/email/imap-poller";
import { sendMailSmtp, verifySmtp } from "@/lib/email/smtp-transport";
import {
  getWorkspaceEmailConfig,
  isSmtpReady,
  type WorkspaceEmailConfig,
} from "@/lib/email/workspace-config";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<WorkspaceEmailConfig> & {
    which?: "imap" | "smtp" | "both";
    sendTestEmail?: boolean;
  };

  const db = await getDb();
  const saved = await getWorkspaceEmailConfig(db, session.workspace.id);
  const config: WorkspaceEmailConfig = {
    enabled: body.enabled ?? saved.enabled,
    imap: {
      host: body.imap?.host ?? saved.imap.host,
      port: body.imap?.port ?? saved.imap.port,
      secure: body.imap?.secure ?? saved.imap.secure,
      user: body.imap?.user ?? saved.imap.user,
      password: body.imap?.password || saved.imap.password,
    },
    smtp: {
      host: body.smtp?.host ?? saved.smtp.host,
      port: body.smtp?.port ?? saved.smtp.port,
      secure: body.smtp?.secure ?? saved.smtp.secure,
      user: body.smtp?.user ?? saved.smtp.user,
      password: body.smtp?.password || saved.smtp.password,
      fromName: body.smtp?.fromName ?? saved.smtp.fromName,
      fromEmail: body.smtp?.fromEmail ?? saved.smtp.fromEmail,
    },
  };

  const which = body.which ?? "both";
  const out: {
    imap?: { ok: boolean; error?: string };
    smtp?: { ok: boolean; error?: string };
    sendTest?: { ok: boolean; error?: string; messageId?: string };
  } = {};

  if (which === "imap" || which === "both") {
    out.imap = await verifyImap(config);
  }
  if (which === "smtp" || which === "both") {
    out.smtp = await verifySmtp(config);
  }

  // Beyond a login/handshake check, actually hand a message to the SMTP
  // server and address it back to the workspace's own configured mailbox —
  // this is the only way to confirm outbound mail is genuinely accepted for
  // delivery, not just that credentials are valid.
  if (body.sendTestEmail && isSmtpReady(config)) {
    const result = await sendMailSmtp(session.workspace.id, {
      to: config.smtp.fromEmail,
      subject: "Bybelt test email",
      text: `This is a test email from Bybelt to confirm outbound delivery is working for ${config.smtp.fromEmail}.`,
    });
    out.sendTest = result.sent
      ? { ok: true, messageId: result.messageId }
      : { ok: false, error: result.reason };
  }

  return NextResponse.json(out);
}
