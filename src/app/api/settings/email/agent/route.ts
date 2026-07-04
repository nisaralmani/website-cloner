import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  getWorkspaceAgentConfig,
  setWorkspaceAgentConfig,
  type AgentConfig,
} from "@/lib/email/agent-config";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  return NextResponse.json(await getWorkspaceAgentConfig(db, session.workspace.id));
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<AgentConfig>;
  try {
    body = (await request.json()) as Partial<AgentConfig>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = await getDb();
  const config = await setWorkspaceAgentConfig(db, session.workspace.id, body);
  return NextResponse.json(config);
}
