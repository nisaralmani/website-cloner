import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { pollWorkspaceInbox } from "@/lib/email/imap-poller";
import { listEmailIngestWorkspaceIds } from "@/lib/email/workspace-config";
import { secretsMatch } from "@/lib/security/constant-time";
import { logSecurityEventForRequest } from "@/lib/security/security-log";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret =
    new URL(request.url).searchParams.get("secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const expected = process.env.CRON_SECRET;
  if (!secretsMatch(secret, expected)) {
    logSecurityEventForRequest(request, {
      type: "auth_failure",
      detail: "invalid cron secret",
    });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspaceIds = await listEmailIngestWorkspaceIds(db);
  if (!workspaceIds.length) {
    return NextResponse.json(
      {
        ok: false,
        error: "No workspaces configured for email ingest (set EMAIL_INGEST_WORKSPACE_ID or enable inbound email in settings)",
      },
      { status: 503 },
    );
  }

  const results: Record<string, Awaited<ReturnType<typeof pollWorkspaceInbox>>> = {};
  for (const workspaceId of workspaceIds) {
    try {
      results[workspaceId] = await pollWorkspaceInbox(db, workspaceId);
    } catch (error) {
      results[workspaceId] = {
        processed: 0,
        created: 0,
        threaded: 0,
        dupes: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  return NextResponse.json({ ok: true, results });
}
