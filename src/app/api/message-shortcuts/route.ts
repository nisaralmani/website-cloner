import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { messageShortcuts } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import {
  groupMessageShortcuts,
  shortcutsByBang,
  toMessageShortcut,
} from "@/lib/message-shortcuts/mappers";
import {
  normalizeBang,
  normalizeTag,
  validateBang,
  validateMessage,
  validateTag,
} from "@/lib/message-shortcuts/validation";

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
      .from(messageShortcuts)
      .where(
        and(
          eq(messageShortcuts.workspaceId, workspaceId),
          query
            ? or(
                sql`lower(${messageShortcuts.bang}) like ${`%${query}%`}`,
                sql`lower(${messageShortcuts.message}) like ${`%${query}%`}`,
                sql`lower(coalesce(${messageShortcuts.tag}, '')) like ${`%${query}%`}`,
              )
            : undefined,
        ),
      )
      .orderBy(asc(messageShortcuts.sortOrder), asc(messageShortcuts.bang)),
  );

  const shortcuts = rows.map(toMessageShortcut);
  const tags = Array.from(
    new Set(
      shortcuts
        .map((shortcut) => shortcut.tag?.trim())
        .filter((tag): tag is string => Boolean(tag)),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return NextResponse.json({
    shortcuts,
    groups: groupMessageShortcuts(shortcuts),
    tags,
    shortcutsByBang: shortcutsByBang(shortcuts),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { bang?: string; tag?: string | null; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.bang || typeof body.message !== "string") {
    return NextResponse.json({ error: "bang and message are required" }, { status: 400 });
  }

  const bang = normalizeBang(body.bang);
  const message = body.message.trim();
  const tag = normalizeTag(body.tag);

  const bangError = validateBang(bang);
  if (bangError) {
    return NextResponse.json({ error: bangError }, { status: 400 });
  }

  const messageError = validateMessage(message);
  if (messageError) {
    return NextResponse.json({ error: messageError }, { status: 400 });
  }

  const tagError = validateTag(tag);
  if (tagError) {
    return NextResponse.json({ error: tagError }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const existing = await selectOne(
    db
      .select()
      .from(messageShortcuts)
      .where(and(eq(messageShortcuts.workspaceId, workspaceId), eq(messageShortcuts.bang, bang))),
  );

  if (existing) {
    return NextResponse.json({ error: "Shortcut already exists" }, { status: 409 });
  }

  const sortRows = await selectAll(
    db
      .select({ sortOrder: messageShortcuts.sortOrder })
      .from(messageShortcuts)
      .where(eq(messageShortcuts.workspaceId, workspaceId))
      .orderBy(asc(messageShortcuts.sortOrder)),
  );

  const nextSortOrder = sortRows.length > 0 ? sortRows[sortRows.length - 1]!.sortOrder + 1 : 0;
  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(messageShortcuts).values({
    id,
    workspaceId,
    bang,
    tag,
    message,
    createdBy: session.user.id,
    sortOrder: nextSortOrder,
    createdAt,
  });

  return NextResponse.json(
    {
      shortcut: {
        id,
        bang,
        tag,
        message,
        createdAt: createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
