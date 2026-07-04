import { NextResponse } from "next/server";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { contacts, workspaces } from "@/db/schema";
import { authorizeWorkspace, isAuthError } from "@/lib/auth/authorization";
import { createContact } from "@/lib/contacts/create";
import { toContact } from "@/lib/contacts/mappers";
export async function GET(request: Request) {
  const auth = await authorizeWorkspace(request);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const segment = searchParams.get("segment")?.trim().toLowerCase() ?? "";

  const db = await getDb();
  const rows = await selectAll(
    db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, auth.workspaceId),
          query
            ? or(
                sql`lower(${contacts.name}) like ${`%${query}%`}`,
                sql`lower(${contacts.email}) like ${`%${query}%`}`,
                sql`lower(${contacts.location}) like ${`%${query}%`}`,
              )
            : undefined,
        ),
      )
      .orderBy(asc(contacts.sortOrder)),
  );

  const workspace = await selectOne(
    db
      .select({ contactTotal: workspaces.contactTotal })
      .from(workspaces)
      .where(eq(workspaces.id, auth.workspaceId)),
  );

  return NextResponse.json({
    contacts: rows
      .map(toContact)
      .filter((contact) =>
        segment ? contact.segments.some((item) => item.toLowerCase() === segment) : true,
      ),
    total: workspace?.contactTotal ?? rows.length,
  });
}

export async function POST(request: Request) {
  const auth = await authorizeWorkspace(request);
  if (isAuthError(auth)) return auth;

  let body: { name?: string; email?: string; location?: string; company?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await createContact(db, auth.workspaceId, {
    name: body.name,
    email: body.email,
    location: body.location,
    company: body.company,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ contact: result.contact }, { status: 201 });
}
