import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { messageShortcuts } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toMessageShortcut } from "@/lib/message-shortcuts/mappers";
import {
  normalizeBang,
  normalizeTag,
  validateBang,
  validateMessage,
  validateTag,
} from "@/lib/message-shortcuts/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { bang?: string; tag?: string | null; message?: string };
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
      .from(messageShortcuts)
      .where(and(eq(messageShortcuts.id, id), eq(messageShortcuts.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Shortcut not found" }, { status: 404 });
  }

  const nextBang = body.bang !== undefined ? normalizeBang(body.bang) : existing.bang;
  const nextMessage = body.message !== undefined ? body.message.trim() : existing.message;
  const nextTag = body.tag !== undefined ? normalizeTag(body.tag) : existing.tag;

  const bangError = validateBang(nextBang);
  if (bangError) {
    return NextResponse.json({ error: bangError }, { status: 400 });
  }

  const messageError = validateMessage(nextMessage);
  if (messageError) {
    return NextResponse.json({ error: messageError }, { status: 400 });
  }

  const tagError = validateTag(nextTag);
  if (tagError) {
    return NextResponse.json({ error: tagError }, { status: 400 });
  }

  if (nextBang !== existing.bang) {
    const duplicate = await selectOne(
      db
        .select()
        .from(messageShortcuts)
        .where(
          and(eq(messageShortcuts.workspaceId, workspaceId), eq(messageShortcuts.bang, nextBang)),
        ),
    );
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json({ error: "Shortcut already exists" }, { status: 409 });
    }
  }

  await db
    .update(messageShortcuts)
    .set({
      bang: nextBang,
      tag: nextTag,
      message: nextMessage,
    })
    .where(and(eq(messageShortcuts.id, id), eq(messageShortcuts.workspaceId, workspaceId)));

  const updated = await selectOne(
    db
      .select()
      .from(messageShortcuts)
      .where(and(eq(messageShortcuts.id, id), eq(messageShortcuts.workspaceId, workspaceId))),
  );

  return NextResponse.json({
    shortcut: updated ? toMessageShortcut(updated) : null,
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
      .from(messageShortcuts)
      .where(and(eq(messageShortcuts.id, id), eq(messageShortcuts.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Shortcut not found" }, { status: 404 });
  }

  await db
    .delete(messageShortcuts)
    .where(and(eq(messageShortcuts.id, id), eq(messageShortcuts.workspaceId, workspaceId)));

  return NextResponse.json({ ok: true, id });
}
