import { NextResponse } from "next/server";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { contacts } from "@/db/schema";
import { contactsToCsv } from "@/lib/contacts/export-csv";
import { toContact } from "@/lib/contacts/mappers";
import { requireSession } from "@/lib/auth/request";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
          eq(contacts.workspaceId, session.workspace.id),
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

  const list = rows
    .map(toContact)
    .filter((contact) =>
      segment ? contact.segments.some((item) => item.toLowerCase() === segment) : true,
    );

  const csv = contactsToCsv(list);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacts.csv"',
    },
  });
}
