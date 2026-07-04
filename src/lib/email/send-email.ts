import { appendEmailSignature } from "@/lib/email/signature-preferences";
import { isCustomSmtpEnabledForWorkspace } from "@/lib/email/delivery-preferences";
import { sendMailSmtp } from "@/lib/email/smtp-transport";
export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  workspaceId?: string;
};

export type SendEmailResult = {
  ok: boolean;
  transport: string;
  messageId?: string;
  error?: string;
};

function emailFromAddress() {
  return process.env.EMAIL_FROM?.trim() || "noreply@localhost";
}

async function sendViaResend(input: SendEmailInput, bodyText: string): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, transport: "resend", error: "Missing RESEND_API_KEY" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFromAddress(),
      to: [input.to],
      subject: input.subject,
      text: bodyText,
      html: input.html ?? undefined,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return { ok: false, transport: "resend", error: detail || `HTTP ${response.status}` };
  }

  const payload = (await response.json()) as { id?: string };
  return { ok: true, transport: "resend", messageId: payload.id };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const envTransport = process.env.EMAIL_TRANSPORT?.trim().toLowerCase() || "log";
  const bodyText = input.workspaceId
    ? await appendEmailSignature(input.workspaceId, input.text)
    : input.text;

  const customSmtp =
    input.workspaceId && (await isCustomSmtpEnabledForWorkspace(input.workspaceId));

  if (customSmtp && input.workspaceId) {
    const result = await sendMailSmtp(input.workspaceId, {
      to: input.to,
      subject: input.subject,
      text: bodyText,
      html: input.html,
    });
    return {
      ok: result.sent,
      transport: result.sent ? "smtp" : "smtp-error",
      messageId: result.messageId,
      error: result.reason,
    };
  }

  if (envTransport === "resend") {
    return sendViaResend(input, bodyText);
  }

  console.info(`[email] to=${input.to} subject=${input.subject}\n${bodyText}`);
  return { ok: true, transport: "log", messageId: `log-${Date.now()}` };
}
