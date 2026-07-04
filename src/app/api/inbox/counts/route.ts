import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { fetchInboxCounts } from "@/lib/inbox/counts";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const counts = await fetchInboxCounts(db, session.workspace.id);

  return NextResponse.json(counts);
}
