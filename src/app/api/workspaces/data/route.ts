import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { buildWorkspaceDataPayload } from "@/lib/workspaces/workspace-data-store";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const payload = await buildWorkspaceDataPayload(db, session.workspace.id);

  return NextResponse.json(payload);
}
