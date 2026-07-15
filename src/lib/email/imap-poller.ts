/**
 * IMAP inbox poller (ported from Ai Helpdesk imap.ts).
 */
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { and, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { workspaceSettings } from "@/db/schema";
import { autoRespondToConversation } from "@/lib/email/ai-auto-responder";
import { runJob } from "@/lib/jobs/runner";
import {
  ingestInboundEmail,
  normalizeRfcMessageId,
} from "@/lib/email/inbound-threading";
import {
  getWorkspaceEmailConfig,
  isImapReady,
  type WorkspaceEmailConfig,
} from "@/lib/email/workspace-config";

const UID_VALIDITY_KEY = "email/inbound::imap-uidvalidity";
const LAST_UID_KEY = "email/inbound::imap-last-uid";

/**
 * Per-workspace IMAP progress marker (UIDVALIDITY + highest processed UID),
 * not the `\Seen` flag. `\Seen` is set by *any* IMAP client touching the
 * mailbox (webmail, a phone's mail app, Outlook) — relying on it means a
 * merchant who simply opens a support email in their own inbox causes it to
 * silently never reach Bybelt. The message-id dedup in ingestInboundEmail
 * already guards against double-processing, so tracking our own watermark is
 * both more correct and safe to combine with a full first-run backfill.
 */
async function getUidWatermark(
  db: AppDatabase,
  workspaceId: string,
): Promise<{ uidValidity: string; lastUid: number } | null> {
  const rows = await selectAll(
    db
      .select({ key: workspaceSettings.settingKey, value: workspaceSettings.value })
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          inArray(workspaceSettings.settingKey, [UID_VALIDITY_KEY, LAST_UID_KEY]),
        ),
      ),
  );
  const uidValidity = rows.find((r) => r.key === UID_VALIDITY_KEY)?.value;
  const lastUid = rows.find((r) => r.key === LAST_UID_KEY)?.value;
  if (!uidValidity || !lastUid) return null;
  return { uidValidity, lastUid: Number(lastUid) };
}

async function setUidWatermark(
  db: AppDatabase,
  workspaceId: string,
  uidValidity: string,
  lastUid: number,
): Promise<void> {
  for (const [settingKey, value] of [
    [UID_VALIDITY_KEY, uidValidity],
    [LAST_UID_KEY, String(lastUid)],
  ] as const) {
    const existing = await selectAll(
      db
        .select({ key: workspaceSettings.settingKey })
        .from(workspaceSettings)
        .where(
          and(
            eq(workspaceSettings.workspaceId, workspaceId),
            eq(workspaceSettings.settingKey, settingKey),
          ),
        ),
    );
    if (existing.length) {
      await db
        .update(workspaceSettings)
        .set({ value })
        .where(
          and(
            eq(workspaceSettings.workspaceId, workspaceId),
            eq(workspaceSettings.settingKey, settingKey),
          ),
        );
    } else {
      await db.insert(workspaceSettings).values({ workspaceId, settingKey, value });
    }
  }
}

export interface PollResult {
  processed: number;
  created: number;
  threaded: number;
  dupes: number;
  errors: string[];
}

function buildClient(config: WorkspaceEmailConfig): ImapFlow {
  return new ImapFlow({
    host: config.imap.host,
    port: config.imap.port || 993,
    secure: config.imap.secure,
    auth: { user: config.imap.user, pass: config.imap.password },
    logger: false,
    tls: { rejectUnauthorized: false },
    socketTimeout: 0,
  });
}

export async function verifyImap(
  config: WorkspaceEmailConfig,
): Promise<{ ok: boolean; error?: string }> {
  if (!isImapReady(config)) {
    return { ok: false, error: "Missing IMAP host/user/password" };
  }
  const client = buildClient(config);
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    lock.release();
    await client.logout();
    return { ok: true };
  } catch (error) {
    try {
      await client.logout();
    } catch {
      // ignore
    }
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function extractPlusConversationId(parsedTo: unknown): string | null {
  const toList = Array.isArray(parsedTo) ? parsedTo : parsedTo ? [parsedTo] : [];
  for (const entry of toList) {
    const value = entry as { value?: { address?: string }[] };
    for (const addr of value.value ?? []) {
      const match = addr.address?.match(/\+([0-9a-f-]{36})@/i);
      if (match?.[1]) {
        return match[1];
      }
    }
  }
  return null;
}

export async function pollWorkspaceInbox(
  db: AppDatabase,
  workspaceId: string,
): Promise<PollResult> {
  const result: PollResult = { processed: 0, created: 0, threaded: 0, dupes: 0, errors: [] };
  const config = await getWorkspaceEmailConfig(db, workspaceId);

  if (!config.enabled || !isImapReady(config)) {
    result.errors.push("IMAP not configured or disabled for workspace");
    return result;
  }

  const client = buildClient(config);
  const touchedConversationIds = new Set<string>();
  // Phase 25 (resource lifecycle): acquire the connection + mailbox lock inside
  // the try so a failure at connect()/getMailboxLock() cannot leak an open IMAP
  // socket — the finally always releases the lock and closes the connection.
  let lock: Awaited<ReturnType<typeof client.getMailboxLock>> | undefined;
  let uidValidity = "";
  let maxUidSeen = 0;

  try {
    await client.connect();
    lock = await client.getMailboxLock("INBOX");

    uidValidity = client.mailbox ? client.mailbox.uidValidity.toString() : "";
    const stored = await getUidWatermark(db, workspaceId);
    // No watermark yet, or the mailbox was recreated (UIDVALIDITY changed):
    // process everything currently in the mailbox once. ingestInboundEmail's
    // message-id dedup makes re-processing already-seen mail a no-op, so a
    // full first-pass backfill is safe.
    const startUid = stored && stored.uidValidity === uidValidity ? stored.lastUid + 1 : 1;
    maxUidSeen = stored && stored.uidValidity === uidValidity ? stored.lastUid : 0;

    for await (const msg of client.fetch(
      `${startUid}:*`,
      { source: true },
      { uid: true },
    )) {
      if (msg.uid < startUid) continue;
      maxUidSeen = Math.max(maxUidSeen, msg.uid);
      const uid = msg.uid;

      try {
        const parsed = await simpleParser(msg.source as Buffer);
        const fromAddr = parsed.from?.value[0];
        const fromEmail = fromAddr?.address?.toLowerCase().trim();
        if (!fromEmail) continue;

        const fromName = fromAddr?.name?.trim() || fromEmail;
        const subject = (parsed.subject || "(no subject)").trim();
        const body = (parsed.text || "").trim();
        const rfcMessageId = normalizeRfcMessageId(parsed.messageId);
        const emailInReplyTo = normalizeRfcMessageId(parsed.inReplyTo);

        let refs: string[] = [];
        if (parsed.references) {
          const raw = Array.isArray(parsed.references)
            ? parsed.references
            : parsed.references.split(/\s+/);
          refs = raw.map(normalizeRfcMessageId).filter(Boolean) as string[];
        }
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
          plusConversationId: extractPlusConversationId(parsed.to),
        });

        if (ingest.status === "duplicate") {
          result.dupes++;
        } else if (ingest.status === "created") {
          result.created++;
          result.processed++;
          touchedConversationIds.add(ingest.conversationId);
        } else {
          result.threaded++;
          result.processed++;
          touchedConversationIds.add(ingest.conversationId);
        }

        await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
      } catch (error) {
        result.errors.push(error instanceof Error ? error.message : String(error));
      }
    }
  } finally {
    // Always release the lock and close the connection, even if connect(),
    // getMailboxLock(), or search() threw — otherwise the socket leaks.
    try {
      lock?.release();
    } catch {
      // ignore — lock may not have been acquired.
    }
    try {
      await client.logout();
    } catch {
      // Graceful logout not possible (connection already dropped) — force close.
      try {
        client.close();
      } catch {
        // ignore.
      }
    }
    if (uidValidity && maxUidSeen > 0) {
      try {
        await setUidWatermark(db, workspaceId, uidValidity, maxUidSeen);
      } catch (error) {
        result.errors.push(
          `Failed to persist IMAP watermark: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  for (const conversationId of touchedConversationIds) {
    // Phase 24C: route the AI auto-response through the job runner (tracked,
    // timed, metered, shutdown-aware). Behavior preserved — sequential, and a
    // failure is swallowed (runJob never throws) exactly as before.
    await runJob(
      "email.auto-respond",
      () => autoRespondToConversation(db, workspaceId, conversationId),
      { correlation: { workspaceId, conversationId } },
    );
  }

  return result;
}
