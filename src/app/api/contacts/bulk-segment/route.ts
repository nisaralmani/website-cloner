import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { contacts } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { serializeSegments } from "@/lib/contacts/mappers";
import type { ContactSegment } from "@/types/contacts";

const VALID_SEGMENTS = new Set<ContactSegment>(["chat", "shopify"]);

function parseSegments(value: string): ContactSegment[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (segment): segment is ContactSegment =>
        typeof segment === "string" && VALID_SEGMENTS.has(segment as ContactSegment),
    );
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { contactIds?: string[]; segment?: ContactSegment };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const segment = body.segment;
  if (!segment || !VALID_SEGMENTS.has(segment)) {
    return NextResponse.json({ error: "segment must be chat or shopify" }, { status: 400 });
  }

  const contactIds = Array.from(
    new Set((body.contactIds ?? []).map((id) => id.trim()).filter(Boolean)),
  );
  if (contactIds.length === 0) {
    return NextResponse.json({ error: "contactIds is required" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const rows = await selectAll(
    db
      .select()
      .from(contacts)
      .where(and(eq(contacts.workspaceId, workspaceId), inArray(contacts.id, contactIds))),
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "No contacts found" }, { status: 404 });
  }

  const updatedIds: string[] = [];
  for (const row of rows) {
    const current = parseSegments(row.segments);
    if (current.includes(segment)) {
      updatedIds.push(row.id);
      continue;
    }
    const next = [...current, segment];
    await db
      .update(contacts)
      .set({ segments: serializeSegments(next) })
      .where(eq(contacts.id, row.id));
    updatedIds.push(row.id);
  }

  return NextResponse.json({ updatedIds, segment });
}
