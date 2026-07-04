import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { buildWorkspaceDangerStatus } from "@/lib/workspaces/danger";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const status = await buildWorkspaceDangerStatus(
    db,
    session.user.id,
    session.workspace.id,
    session.role ?? "member",
  );

  return NextResponse.json(status);
}
