import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { workspaceApiTokens } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";

type RouteContext = { params: Promise<{ id: string }> };

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
      .from(workspaceApiTokens)
      .where(and(eq(workspaceApiTokens.id, id), eq(workspaceApiTokens.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "API token not found" }, { status: 404 });
  }

  await db
    .delete(workspaceApiTokens)
    .where(and(eq(workspaceApiTokens.id, id), eq(workspaceApiTokens.workspaceId, workspaceId)));

  return NextResponse.json({ ok: true, id });
}
