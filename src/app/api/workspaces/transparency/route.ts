import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  listTransparencyActionOptions,
  listTransparencyOperatorOptions,
  listWorkspaceAuditLogs,
} from "@/lib/transparency/audit-logs";
import { parseTransparencyQuery } from "@/lib/transparency/validation";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = parseTransparencyQuery(new URL(request.url).searchParams);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const [logs, operators, actions] = await Promise.all([
    listWorkspaceAuditLogs(db, workspaceId, parsed),
    listTransparencyOperatorOptions(db, workspaceId),
    listTransparencyActionOptions(db, workspaceId),
  ]);

  return NextResponse.json({
    logs,
    operators,
    actions,
  });
}
