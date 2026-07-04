import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { chatboxRestrictions } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";

export async function POST() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  await db
    .delete(chatboxRestrictions)
    .where(
      and(
        eq(chatboxRestrictions.workspaceId, workspaceId),
        eq(chatboxRestrictions.kind, "blocked_visitor"),
      ),
    );

  return NextResponse.json({ cleared: true });
}
