import { randomUUID } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { userSessions } from "@/db/schema";
import { formatSessionWhen } from "@/lib/auth/session-time";
import { formatUserAgentLabel } from "@/lib/auth/user-agent";
import { createComponentLogger } from "@/lib/logging/logger";

const log = createComponentLogger("auth:user-sessions");

export type UserSessionMeta = {
  userAgent: string;
  ipAddress: string;
  country?: string;
};

export async function createUserSession(userId: string, meta: UserSessionMeta) {
  const db = await getDb();
  const now = new Date();
  const id = randomUUID();

  await db.insert(userSessions).values({
    id,
    userId,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
    country: meta.country ?? "Unknown",
    createdAt: now,
    lastSeenAt: now,
    revokedAt: null,
  });

  return id;
}

/**
 * Best-effort last-seen timestamp update. Its only caller (`requireSession`,
 * on essentially every authenticated request) invokes it fire-and-forget
 * (`void touchUserSession(...)`, no `.catch()`) — a transient DB error here
 * must never fail the request it's touching, and must not become an unhandled
 * promise rejection (fatal by default in Node 15+) on the app's hottest path.
 */
export async function touchUserSession(sessionId: string) {
  try {
    const db = await getDb();
    await db
      .update(userSessions)
      .set({ lastSeenAt: new Date() })
      .where(and(eq(userSessions.id, sessionId), isNull(userSessions.revokedAt)));
  } catch (error) {
    log.warn("touch_user_session_failed", {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function isUserSessionActive(sessionId: string) {
  const db = await getDb();
  const row = await selectOne(
    db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.id, sessionId), isNull(userSessions.revokedAt))),
  );
  return Boolean(row);
}

/** True only when the session row exists and was explicitly revoked. */
export async function isUserSessionRevoked(sessionId: string) {
  const db = await getDb();
  const row = await selectOne(
    db.select().from(userSessions).where(eq(userSessions.id, sessionId)),
  );
  return Boolean(row?.revokedAt);
}

export async function revokeUserSession(sessionId: string, userId: string) {
  const db = await getDb();
  const row = await selectOne(
    db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.id, sessionId), eq(userSessions.userId, userId))),
  );
  if (!row || row.revokedAt) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const now = new Date();
  await db
    .update(userSessions)
    .set({ revokedAt: now })
    .where(eq(userSessions.id, sessionId));

  return { ok: true as const, revokedAt: now };
}

export async function listUserSessions(userId: string) {
  const db = await getDb();
  return selectAll(
    db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.createdAt)),
  );
}

export function toPublicSession(
  row: typeof userSessions.$inferSelect,
  currentSessionId: string | null,
) {
  const userAgentLabel = formatUserAgentLabel(row.userAgent);
  const isActive = row.revokedAt === null;

  return {
    id: row.id,
    userAgent: userAgentLabel,
    ipAddress: row.ipAddress,
    country: row.country,
    createdAt: row.createdAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    whenLabel: formatSessionWhen(row.createdAt),
    isCurrent: row.id === currentSessionId,
    state: isActive ? ("authorized" as const) : ("closed" as const),
  };
}

export function buildSecurityPayload(
  rows: Array<typeof userSessions.$inferSelect>,
  currentSessionId: string | null,
) {
  const sessions = rows.map((row) => toPublicSession(row, currentSessionId));
  const activeSessions = sessions.filter((session) => session.state === "authorized");
  const loginHistory = sessions;

  return {
    currentSessionId,
    activeSessions,
    loginHistory,
  };
}
