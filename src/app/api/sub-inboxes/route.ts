import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { subInboxes } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { activeSubInboxCount, toSubInbox } from "@/lib/sub-inboxes/mappers";
import {
  defaultSubInboxName,
  normalizeSubInboxSegment,
  validateSubInboxName,
  validateSubInboxSegment,
} from "@/lib/sub-inboxes/validation";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const workspaceId = session.workspace.id;
  const db = await getDb();

  const rows = await selectAll(
    db
      .select()
      .from(subInboxes)
      .where(
        and(
          eq(subInboxes.workspaceId, workspaceId),
          query
            ? or(
                sql`lower(${subInboxes.name}) like ${`%${query}%`}`,
                sql`lower(coalesce(${subInboxes.segment}, '')) like ${`%${query}%`}`,
              )
            : undefined,
        ),
      )
      .orderBy(asc(subInboxes.sortOrder), asc(subInboxes.name)),
  );

  const items = rows.map(toSubInbox);

  return NextResponse.json({
    subInboxes: items,
    activeCount: activeSubInboxCount(items),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; segment?: string | null; enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const existingRows = await selectAll(
    db
      .select({ sortOrder: subInboxes.sortOrder })
      .from(subInboxes)
      .where(eq(subInboxes.workspaceId, workspaceId))
      .orderBy(asc(subInboxes.sortOrder)),
  );

  const name = (body.name ?? defaultSubInboxName(existingRows.length)).trim();
  const segment = normalizeSubInboxSegment(body.segment);
  const enabled = body.enabled ?? true;

  const nameError = validateSubInboxName(name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const segmentError = validateSubInboxSegment(segment);
  if (segmentError) {
    return NextResponse.json({ error: segmentError }, { status: 400 });
  }

  const duplicate = await db
    .select({ id: subInboxes.id })
    .from(subInboxes)
    .where(and(eq(subInboxes.workspaceId, workspaceId), eq(subInboxes.name, name)))
    .limit(1);

  if (duplicate.length > 0) {
    return NextResponse.json({ error: "Sub-inbox name already exists" }, { status: 409 });
  }

  const nextSortOrder =
    existingRows.length > 0 ? existingRows[existingRows.length - 1]!.sortOrder + 1 : 0;
  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(subInboxes).values({
    id,
    workspaceId,
    name,
    segment,
    enabled: enabled ? 1 : 0,
    sortOrder: nextSortOrder,
    createdAt,
  });

  return NextResponse.json(
    {
      subInbox: {
        id,
        name,
        segment,
        enabled,
        createdAt: createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
