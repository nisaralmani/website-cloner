import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { pollWorkspaceInbox } from "@/lib/email/imap-poller";
import { getWorkspaceEmailConfig, isImapReady } from "@/lib/email/workspace-config";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const config = await getWorkspaceEmailConfig(db, session.workspace.id);
  if (!isImapReady(config)) {
    return NextResponse.json(
      { ok: false, error: "IMAP not configured for this workspace" },
      { status: 503 },
    );
  }

  try {
    const result = await pollWorkspaceInbox(db, session.workspace.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
