import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { contacts } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { contactIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const contactIds = Array.from(
    new Set((body.contactIds ?? []).map((id) => id.trim()).filter(Boolean)),
  );
  if (contactIds.length === 0) {
    return NextResponse.json({ error: "contactIds is required" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const rows = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.workspaceId, workspaceId), inArray(contacts.id, contactIds)));

  const ids = rows.map((row) => row.id);
  if (ids.length === 0) {
    return NextResponse.json({ error: "No contacts found" }, { status: 404 });
  }

  await db
    .delete(contacts)
    .where(and(eq(contacts.workspaceId, workspaceId), inArray(contacts.id, ids)));

  return NextResponse.json({ deletedIds: ids });
}
