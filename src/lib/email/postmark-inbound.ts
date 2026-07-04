/**
 * Postmark inbound webhook handler (ported from Ai Helpdesk).
 */
import type { AppDatabase } from "@/db/client";
import { autoRespondToConversation } from "@/lib/email/ai-auto-responder";
import { runJob } from "@/lib/jobs/runner";
import { ingestInboundEmail, normalizeRfcMessageId } from "@/lib/email/inbound-threading";

interface PostmarkHeader {
  Name: string;
  Value: string;
}

interface PostmarkInbound {
  FromFull?: { Email?: string; Name?: string };
  From?: string;
  FromName?: string;
  Subject?: string;
  TextBody?: string;
  StrippedTextReply?: string;
  MessageID?: string;
  Headers?: PostmarkHeader[];
}

function header(headers: PostmarkHeader[] | undefined, name: string): string | undefined {
  return headers?.find((entry) => entry.Name.toLowerCase() === name.toLowerCase())?.Value;
}

export async function handlePostmarkInbound(
  db: AppDatabase,
  workspaceId: string,
  payload: PostmarkInbound,
) {
  const fromEmail = (payload.FromFull?.Email || payload.From || "").toLowerCase().trim();
  if (!fromEmail) {
    return { ok: false as const, status: 400, body: { error: "no sender" } };
  }

  const fromName = payload.FromFull?.Name || payload.FromName || fromEmail;
  const body = (payload.StrippedTextReply || payload.TextBody || "").trim();
  const subject = (payload.Subject || "").trim();
  const rfcMessageId =
    normalizeRfcMessageId(header(payload.Headers, "Message-ID")) ||
    (payload.MessageID ? `<${payload.MessageID}@inbound.postmark>` : undefined);
  const emailInReplyTo = normalizeRfcMessageId(header(payload.Headers, "In-Reply-To"));
  const refs = (header(payload.Headers, "References") || "")
    .split(/\s+/)
    .map(normalizeRfcMessageId)
    .filter(Boolean) as string[];

  if (emailInReplyTo && !refs.includes(emailInReplyTo)) {
    refs.push(emailInReplyTo);
  }

  const ingest = await ingestInboundEmail(db, workspaceId, {
    fromEmail,
    fromName,
    subject,
    body,
    rfcMessageId,
    emailInReplyTo,
    refs,
  });

  if (ingest.status !== "duplicate") {
    // Phase 24C: tracked/metered via the job runner; failure swallowed as before.
    await runJob(
      "email.auto-respond",
      () => autoRespondToConversation(db, workspaceId, ingest.conversationId),
      { correlation: { workspaceId, conversationId: ingest.conversationId } },
    );
  }

  return {
    ok: true as const,
    status: 200,
    body: { ok: true, ingest },
  };
}
