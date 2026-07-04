import { asc, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { conversationSegments } from "@/db/schema";

const MAX_SEGMENT_LENGTH = 64;

export function normalizeConversationSegment(value: string): string {
  return value.trim();
}

export function validateConversationSegment(value: string): string | null {
  const normalized = normalizeConversationSegment(value);
  if (!normalized) {
    return "Segment is required";
  }

  if (normalized.length > MAX_SEGMENT_LENGTH) {
    return "Segment is too long";
  }

  return null;
}

export function parseConversationSegmentInput(
  body: { segment?: string },
): { segment: string } | { error: string } {
  if (typeof body.segment !== "string") {
    return { error: "segment is required" };
  }

  const segment = normalizeConversationSegment(body.segment);
  const validationError = validateConversationSegment(segment);
  if (validationError) {
    return { error: validationError };
  }

  return { segment };
}

export async function fetchSegmentsForConversation(
  db: AppDatabase,
  conversationId: string,
): Promise<string[]> {
  const rows = await selectAll(
    db
      .select({ segment: conversationSegments.segment })
      .from(conversationSegments)
      .where(eq(conversationSegments.conversationId, conversationId))
      .orderBy(asc(conversationSegments.segment)),
  );

  return rows.map((row) => row.segment);
}

export async function fetchSegmentsMapForConversations(
  db: AppDatabase,
  conversationIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (conversationIds.length === 0) {
    return map;
  }

  const rows = await selectAll(
    db
      .select({
        conversationId: conversationSegments.conversationId,
        segment: conversationSegments.segment,
      })
      .from(conversationSegments)
      .where(inArray(conversationSegments.conversationId, conversationIds))
      .orderBy(asc(conversationSegments.segment)),
  );

  for (const row of rows) {
    const current = map.get(row.conversationId) ?? [];
    current.push(row.segment);
    map.set(row.conversationId, current);
  }

  return map;
}
