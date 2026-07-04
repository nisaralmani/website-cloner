import { and, asc, eq, gte, or, sql } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { visitorChatSessions, visitors } from "@/db/schema";
import {
  VISITOR_ACTIVE_WINDOW_MS,
  VISITOR_ONLINE_WINDOW_MS,
} from "@/lib/visitors/constants";
import { toVisitor } from "@/lib/visitors/mappers";

function onlineCutoff() {
  return new Date(Date.now() - VISITOR_ONLINE_WINDOW_MS);
}

export async function pruneStaleVisitors(db: AppDatabase, workspaceId: string) {
  const cutoff = onlineCutoff();
  const liveRows = await selectAll(
    db
      .select({ id: visitorChatSessions.id })
      .from(visitorChatSessions)
      .where(
        and(
          eq(visitorChatSessions.workspaceId, workspaceId),
          gte(visitorChatSessions.lastSeenAt, cutoff),
        ),
      ),
  );
  const liveIds = new Set(liveRows.map((row) => row.id));

  const visitorRows = await selectAll(
    db
      .select({ id: visitors.id })
      .from(visitors)
      .where(eq(visitors.workspaceId, workspaceId)),
  );

  for (const row of visitorRows) {
    if (!liveIds.has(row.id)) {
      await db.delete(visitors).where(eq(visitors.id, row.id));
    }
  }
}

export async function listLiveVisitors(
  db: AppDatabase,
  workspaceId: string,
  query = "",
) {
  const cutoff = onlineCutoff();
  const normalizedQuery = query.trim().toLowerCase();

  const rows = await selectAll(
    db
      .select({
        visitor: visitors,
        conversationId: visitorChatSessions.conversationId,
        lastSeenAt: visitorChatSessions.lastSeenAt,
      })
      .from(visitors)
      .innerJoin(visitorChatSessions, eq(visitorChatSessions.id, visitors.id))
      .where(
        and(
          eq(visitors.workspaceId, workspaceId),
          gte(visitorChatSessions.lastSeenAt, cutoff),
          normalizedQuery
            ? or(
                sql`lower(${visitors.name}) like ${`%${normalizedQuery}%`}`,
                sql`lower(${visitors.city}) like ${`%${normalizedQuery}%`}`,
                sql`lower(${visitors.currentPage}) like ${`%${normalizedQuery}%`}`,
                sql`lower(${visitors.location}) like ${`%${normalizedQuery}%`}`,
              )
            : undefined,
        ),
      )
      .orderBy(asc(visitors.sortOrder)),
  );

  const now = Date.now();
  const list = rows.map(({ visitor, conversationId, lastSeenAt }) => {
    const seenAt = lastSeenAt.getTime();
    const isActive = now - seenAt <= VISITOR_ACTIVE_WINDOW_MS;
    return toVisitor(
      { ...visitor, isActive: isActive ? 1 : 0 },
      conversationId,
    );
  });

  const online = list.length;
  const active = list.filter((visitor) => visitor.isActive).length;

  return { visitors: list, stats: { online, active }, total: list.length };
}
