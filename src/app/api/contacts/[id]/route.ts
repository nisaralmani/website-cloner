import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { contacts } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { deleteContact, updateContact } from "@/lib/contacts/create";
import { toContact } from "@/lib/contacts/mappers";
import { assertCanDeleteWorkspaceData } from "@/lib/workspaces/operator-permissions";
import type { ContactSegment } from "@/types/contacts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const row = await selectOne(db.select().from(contacts).where(eq(contacts.id, id)));

  if (!row || row.workspaceId !== session.workspace.id) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ contact: toContact(row) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: {
    name?: string;
    email?: string;
    location?: string;
    company?: string;
    segments?: ContactSegment[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = await getDb();
  const result = await updateContact(db, session.workspace.id, id, body);
  if (!result.ok) {
    if ("reason" in result && result.reason === "not_found") {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ contact: result.contact });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const permissionError = await assertCanDeleteWorkspaceData(
    db,
    session.workspace.id,
    session.role,
  );
  if (permissionError) {
    return NextResponse.json({ error: permissionError }, { status: 403 });
  }

  const result = await deleteContact(db, session.workspace.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ id: result.id });
}
