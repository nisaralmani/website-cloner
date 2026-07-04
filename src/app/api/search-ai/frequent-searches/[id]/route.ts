import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { searchAiFrequentSearches } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toSearchAiFrequentSearch } from "@/lib/search-ai/mappers";
import { validateFrequentSearchQuery } from "@/lib/search-ai/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const queryError = validateFrequentSearchQuery(body.query);
  if (queryError) {
    return NextResponse.json({ error: queryError }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const existing = await selectOne(
    db
      .select()
      .from(searchAiFrequentSearches)
      .where(
        and(eq(searchAiFrequentSearches.id, id), eq(searchAiFrequentSearches.workspaceId, workspaceId)),
      ),
  );

  if (!existing) {
    return NextResponse.json({ error: "Frequent search not found" }, { status: 404 });
  }

  const query = body.query.trim();

  await db
    .update(searchAiFrequentSearches)
    .set({ query })
    .where(
      and(eq(searchAiFrequentSearches.id, id), eq(searchAiFrequentSearches.workspaceId, workspaceId)),
    );

  const updated = await selectOne(
    db
      .select()
      .from(searchAiFrequentSearches)
      .where(
        and(eq(searchAiFrequentSearches.id, id), eq(searchAiFrequentSearches.workspaceId, workspaceId)),
      ),
  );

  return NextResponse.json({
    search: updated ? toSearchAiFrequentSearch(updated) : null,
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
      .from(searchAiFrequentSearches)
      .where(
        and(eq(searchAiFrequentSearches.id, id), eq(searchAiFrequentSearches.workspaceId, workspaceId)),
      ),
  );

  if (!existing) {
    return NextResponse.json({ error: "Frequent search not found" }, { status: 404 });
  }

  await db
    .delete(searchAiFrequentSearches)
    .where(
      and(eq(searchAiFrequentSearches.id, id), eq(searchAiFrequentSearches.workspaceId, workspaceId)),
    );

  return NextResponse.json({ ok: true, id });
}
