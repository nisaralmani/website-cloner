import { randomUUID } from "crypto";
import { and, eq, max } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import {
  chatboxRestrictions,
  conversations,
  visitorChatSessions,
  workspaces,
} from "@/db/schema";
import { formatConversationTime } from "@/lib/inbox/time";
import { applyRoutingRulesOnConversation } from "@/lib/routing-rules/apply";
import { evaluateChatboxAccess } from "@/lib/chatbox/restriction-enforcement";
import { assertChatboxDomainAllowed } from "@/lib/chatbox/domain-lock";
import { upsertLiveVisitorFromSession } from "@/lib/visitors/live-visitor";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";
import { backfillOrderContextForConversation } from "@/lib/integrations/order-backfill-resolver";
import { normalizeCustomerEmail } from "@/lib/inbox/customer-email";
import { createComponentLogger } from "@/lib/logging/logger";

const log = createComponentLogger("chatbox:visitor-session");

const VISITOR_GRADIENTS = [
  "from-violet-400 to-blue-500",
  "from-sky-400 to-indigo-500",
  "from-fuchsia-400 to-purple-500",
  "from-cyan-400 to-blue-500",
  "from-teal-400 to-emerald-500",
] as const;

export type VisitorSessionMeta = {
  country?: string;
  locale?: string;
  pageUrl?: string;
  email?: string;
  phone?: string;
  ip?: string;
};

export function generateVisitorNickname(): string {
  const suffix = Math.floor(Math.random() * 900_000) + 100_000;
  return `visitor${suffix}`;
}

export function pickVisitorGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % VISITOR_GRADIENTS.length;
  }
  return VISITOR_GRADIENTS[hash] ?? VISITOR_GRADIENTS[0];
}

export async function resolveWorkspaceForChatbox(
  db: AppDatabase,
  input: { workspaceId?: string; domain?: string },
) {
  const workspaceId = input.workspaceId?.trim();
  const domain = input.domain?.trim().toLowerCase();

  if (workspaceId) {
    const row = await selectOne(
      db.select().from(workspaces).where(eq(workspaces.id, workspaceId)),
    );
    return row ?? null;
  }

  if (domain) {
    const row = await selectOne(
      db.select().from(workspaces).where(eq(workspaces.domain, domain)),
    );
    return row ?? null;
  }

  return null;
}

export async function assertChatboxSessionAllowed(
  db: AppDatabase,
  workspaceId: string,
  meta: VisitorSessionMeta,
  options: { userAgent?: string | null; workspaceDomain?: string; requestDomain?: string | null } = {},
) {
  if (options.workspaceDomain) {
    const domainError = await assertChatboxDomainAllowed(
      db,
      workspaceId,
      options.workspaceDomain,
      options.requestDomain,
    );
    if (domainError) {
      return domainError;
    }
  }

  const access = await evaluateChatboxAccess(db, workspaceId, meta, options.userAgent);
  if (!access.allowed) {
    return access.reason ?? "Chatbox access denied";
  }
  return null;
}

export async function isVisitorBlocked(
  db: AppDatabase,
  workspaceId: string,
  meta: VisitorSessionMeta,
): Promise<boolean> {
  const candidates = [meta.email?.trim().toLowerCase(), meta.ip?.trim()].filter(Boolean) as string[];
  if (candidates.length === 0) {
    return false;
  }

  for (const value of candidates) {
    const row = await selectOne(
      db
        .select({ id: chatboxRestrictions.id })
        .from(chatboxRestrictions)
        .where(
          and(
            eq(chatboxRestrictions.workspaceId, workspaceId),
            eq(chatboxRestrictions.kind, "blocked_visitor"),
            eq(chatboxRestrictions.value, value),
          ),
        ),
    );
    if (row) {
      return true;
    }
  }

  return false;
}

export async function getVisitorChatSession(db: AppDatabase, sessionId: string) {
  return selectOne(
    db.select().from(visitorChatSessions).where(eq(visitorChatSessions.id, sessionId)),
  );
}

export async function createVisitorChatSession(
  db: AppDatabase,
  workspaceId: string,
  meta: VisitorSessionMeta = {},
) {
  const sessionId = randomUUID();
  const conversationId = randomUUID();
  const nickname = generateVisitorNickname();
  const now = new Date();
  const country = meta.country?.trim().toUpperCase().slice(0, 2) || "US";
  const normalizedEmail = normalizeCustomerEmail(meta.email);

  const [maxOrderRow] = await db
    .select({ value: max(conversations.sortOrder) })
    .from(conversations)
    .where(eq(conversations.workspaceId, workspaceId));

  await db.insert(conversations).values({
    id: conversationId,
    workspaceId,
    name: nickname,
    initials: null,
    preview: "New conversation",
    timeLabel: formatConversationTime(now),
    unread: 0,
    status: "pending",
    country,
    avatarGradient: pickVisitorGradient(sessionId),
    sortOrder: (maxOrderRow?.value ?? -1) + 1,
    channel: "chatbox",
    ip: meta.ip?.trim() || null,
    customerEmail: normalizedEmail,
  });

  await db.insert(visitorChatSessions).values({
    id: sessionId,
    workspaceId,
    conversationId,
    visitorNickname: nickname,
    country,
    locale: meta.locale?.trim() || null,
    pageUrl: meta.pageUrl?.trim() || null,
    email: normalizedEmail,
    phone: meta.phone?.trim() || null,
    ip: meta.ip?.trim() || null,
    createdAt: now,
    lastSeenAt: now,
  });

  await applyRoutingRulesOnConversation(db, workspaceId, conversationId, {
    pageUrl: meta.pageUrl?.trim() || null,
  });

  const sessionRow = await getVisitorChatSession(db, sessionId);
  if (sessionRow) {
    await upsertLiveVisitorFromSession(db, sessionRow, {
      pageUrl: meta.pageUrl?.trim() || undefined,
    });
  }

  void deliverWorkspaceWebhooks(db, workspaceId, "conversation:created", {
    conversationId,
    sessionId,
  });

  // If the conversation is born linkable (visitor arrived with a known email),
  // attach any order context that may have been delivered before it existed.
  void backfillOrderContextForConversation(
    db,
    workspaceId,
    conversationId,
    normalizedEmail,
  );

  return {
    sessionId,
    conversationId,
    visitorNickname: nickname,
  };
}

/**
 * Best-effort last-seen timestamp update. Called fire-and-forget (no
 * `.catch()`) from the SSE stream route, where an unhandled rejection would
 * be fatal to the process — and elsewhere as a minor housekeeping step that
 * must not fail the request (ping/typing/send) it's attached to over a
 * transient DB error.
 */
export async function touchVisitorChatSession(db: AppDatabase, sessionId: string) {
  try {
    const now = new Date();
    await db
      .update(visitorChatSessions)
      .set({ lastSeenAt: now })
      .where(eq(visitorChatSessions.id, sessionId));
  } catch (error) {
    log.warn("touch_visitor_chat_session_failed", {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
