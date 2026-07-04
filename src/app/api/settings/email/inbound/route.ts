import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  getWorkspaceEmailConfig,
  getWorkspaceEmailConfigPublic,
  setWorkspaceEmailConfig,
  type WorkspaceEmailConfig,
} from "@/lib/email/workspace-config";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  return NextResponse.json(
    await getWorkspaceEmailConfigPublic(db, session.workspace.id),
  );
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: WorkspaceEmailConfig;
  try {
    body = (await request.json()) as WorkspaceEmailConfig;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = await getDb();
  await setWorkspaceEmailConfig(db, session.workspace.id, body);
  return NextResponse.json(await getWorkspaceEmailConfigPublic(db, session.workspace.id));
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const saved = await getWorkspaceEmailConfig(db, session.workspace.id);
  let body: Partial<WorkspaceEmailConfig>;
  try {
    body = (await request.json()) as Partial<WorkspaceEmailConfig>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await setWorkspaceEmailConfig(db, session.workspace.id, {
    enabled: body.enabled ?? saved.enabled,
    imap: { ...saved.imap, ...(body.imap ?? {}) },
    smtp: { ...saved.smtp, ...(body.smtp ?? {}) },
  });

  return NextResponse.json(await getWorkspaceEmailConfigPublic(db, session.workspace.id));
}
