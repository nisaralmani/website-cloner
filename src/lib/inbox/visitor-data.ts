import { asc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { conversationVisitorData } from "@/db/schema";
import type { VisitorDataEntry } from "@/types/inbox";

const MAX_KEY_LENGTH = 64;
const MAX_VALUE_LENGTH = 500;

export function toVisitorDataEntry(
  row: typeof conversationVisitorData.$inferSelect,
): VisitorDataEntry {
  return {
    key: row.dataKey,
    value: row.dataValue,
  };
}

export async function fetchVisitorDataForConversation(
  db: AppDatabase,
  conversationId: string,
): Promise<VisitorDataEntry[]> {
  const rows = await selectAll(
    db
      .select()
      .from(conversationVisitorData)
      .where(eq(conversationVisitorData.conversationId, conversationId))
      .orderBy(asc(conversationVisitorData.dataKey)),
  );

  return rows.map(toVisitorDataEntry);
}

export function parseVisitorDataInput(
  body: { key?: string; value?: string },
): { key: string; value: string } | { error: string } {
  const key = body.key?.trim() ?? "";
  const value = body.value?.trim() ?? "";

  if (!key) {
    return { error: "Data key is required" };
  }

  if (key.length > MAX_KEY_LENGTH) {
    return { error: "Data key is too long" };
  }

  if (!value) {
    return { error: "Data value is required" };
  }

  if (value.length > MAX_VALUE_LENGTH) {
    return { error: "Data value is too long" };
  }

  return { key, value };
}

export function parseVisitorDataKeyInput(
  body: { key?: string },
): { key: string } | { error: string } {
  const key = body.key?.trim() ?? "";

  if (!key) {
    return { error: "Data key is required" };
  }

  if (key.length > MAX_KEY_LENGTH) {
    return { error: "Data key is too long" };
  }

  return { key };
}
