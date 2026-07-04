import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { listLiveVisitors, pruneStaleVisitors } from "@/lib/visitors/live-query";
import { browsingPresenceSnapshot } from "@/lib/visitors/presence-store";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  const db = await getDb();
  const workspaceId = session.workspace.id;
  await pruneStaleVisitors(db, workspaceId);
  const payload = await listLiveVisitors(db, workspaceId, query);
  const browsing = browsingPresenceSnapshot(workspaceId);

  return NextResponse.json({ ...payload, browsing });
}
