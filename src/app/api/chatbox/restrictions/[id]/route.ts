import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { chatboxRestrictions } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";

import { validateChatboxRestrictionValue } from "@/lib/chatbox/restrictions";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.value?.trim()) {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;
  const existing = await selectOne(
    db
      .select()
      .from(chatboxRestrictions)
      .where(and(eq(chatboxRestrictions.id, id), eq(chatboxRestrictions.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Restriction not found" }, { status: 404 });
  }

  const validationError = validateChatboxRestrictionValue(existing.kind as never, body.value);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  await db
    .update(chatboxRestrictions)
    .set({ value: body.value.trim() })
    .where(and(eq(chatboxRestrictions.id, id), eq(chatboxRestrictions.workspaceId, workspaceId)));

  return NextResponse.json({ id, value: body.value.trim() });
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
      .from(chatboxRestrictions)
      .where(and(eq(chatboxRestrictions.id, id), eq(chatboxRestrictions.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Restriction not found" }, { status: 404 });
  }

  await db
    .delete(chatboxRestrictions)
    .where(and(eq(chatboxRestrictions.id, id), eq(chatboxRestrictions.workspaceId, workspaceId)));

  return NextResponse.json({ id });
}
