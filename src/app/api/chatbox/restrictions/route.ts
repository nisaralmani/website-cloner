import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { chatboxRestrictions } from "@/db/schema";
import { toChatboxRestriction } from "@/lib/chatbox/restriction-mappers";
import {
  defaultRestrictionValue,
  isChatboxRestrictionKind,
  validateChatboxRestrictionValue,
} from "@/lib/chatbox/restrictions";
import { requireSession } from "@/lib/auth/request";
import type { ChatboxRestrictionKind } from "@/types/chatbox-restrictions";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = session.workspace.id;
  const db = await getDb();

  const rows = await selectAll(
    db
      .select()
      .from(chatboxRestrictions)
      .where(eq(chatboxRestrictions.workspaceId, workspaceId))
      .orderBy(asc(chatboxRestrictions.kind), asc(chatboxRestrictions.sortOrder)),
  );

  return NextResponse.json({
    restrictions: rows.map(toChatboxRestriction),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { kind?: string; value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const kind = body.kind?.trim();
  if (!kind || !isChatboxRestrictionKind(kind)) {
    return NextResponse.json({ error: "Restriction kind is required" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const existingRows = await selectAll(
    db
      .select({ sortOrder: chatboxRestrictions.sortOrder, kind: chatboxRestrictions.kind })
      .from(chatboxRestrictions)
      .where(eq(chatboxRestrictions.workspaceId, workspaceId))
      .orderBy(asc(chatboxRestrictions.sortOrder)),
  );

  const kindCount = existingRows.filter((row) => row.kind === kind).length;
  const value = (body.value ?? defaultRestrictionValue(kind, kindCount)).trim();
  const valueError = validateChatboxRestrictionValue(kind, value);
  if (valueError) {
    return NextResponse.json({ error: valueError }, { status: 400 });
  }

  const duplicate = await db
    .select({ id: chatboxRestrictions.id })
    .from(chatboxRestrictions)
    .where(
      and(
        eq(chatboxRestrictions.workspaceId, workspaceId),
        eq(chatboxRestrictions.kind, kind),
        eq(chatboxRestrictions.value, value),
      ),
    )
    .limit(1);

  if (duplicate.length > 0) {
    return NextResponse.json({ error: "Restriction already exists" }, { status: 409 });
  }

  const nextSortOrder =
    existingRows.length > 0 ? existingRows[existingRows.length - 1]!.sortOrder + 1 : 0;
  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(chatboxRestrictions).values({
    id,
    workspaceId,
    kind,
    value,
    sortOrder: nextSortOrder,
    createdAt,
  });

  return NextResponse.json(
    {
      restriction: {
        id,
        kind: kind as ChatboxRestrictionKind,
        value,
        createdAt: createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
