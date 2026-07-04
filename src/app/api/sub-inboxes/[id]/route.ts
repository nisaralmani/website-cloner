import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { subInboxes } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toSubInbox } from "@/lib/sub-inboxes/mappers";
import {
  normalizeSubInboxSegment,
  validateSubInboxName,
  validateSubInboxSegment,
} from "@/lib/sub-inboxes/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { name?: string; segment?: string | null; enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const existing = await selectOne(
    db
      .select()
      .from(subInboxes)
      .where(and(eq(subInboxes.id, id), eq(subInboxes.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Sub-inbox not found" }, { status: 404 });
  }

  const nextName = body.name !== undefined ? body.name.trim() : existing.name;
  const nextSegment =
    body.segment !== undefined ? normalizeSubInboxSegment(body.segment) : existing.segment;
  const nextEnabled =
    body.enabled !== undefined ? (body.enabled ? 1 : 0) : existing.enabled;

  const nameError = validateSubInboxName(nextName);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const segmentError = validateSubInboxSegment(nextSegment);
  if (segmentError) {
    return NextResponse.json({ error: segmentError }, { status: 400 });
  }

  if (nextName !== existing.name) {
    const duplicate = await selectOne(
      db
        .select()
        .from(subInboxes)
        .where(and(eq(subInboxes.workspaceId, workspaceId), eq(subInboxes.name, nextName))),
    );
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json({ error: "Sub-inbox name already exists" }, { status: 409 });
    }
  }

  await db
    .update(subInboxes)
    .set({
      name: nextName,
      segment: nextSegment,
      enabled: nextEnabled,
    })
    .where(and(eq(subInboxes.id, id), eq(subInboxes.workspaceId, workspaceId)));

  const updated = await selectOne(
    db
      .select()
      .from(subInboxes)
      .where(and(eq(subInboxes.id, id), eq(subInboxes.workspaceId, workspaceId))),
  );

  return NextResponse.json({
    subInbox: updated ? toSubInbox(updated) : null,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const workspaceId = session.workspace.id;

  const existing = await selectOne(
    db
      .select()
      .from(subInboxes)
      .where(and(eq(subInboxes.id, id), eq(subInboxes.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Sub-inbox not found" }, { status: 404 });
  }

  await db
    .delete(subInboxes)
    .where(and(eq(subInboxes.id, id), eq(subInboxes.workspaceId, workspaceId)));

  return NextResponse.json({ ok: true, id });
}
