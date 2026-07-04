import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { workspaces } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toPublicWorkspace } from "@/lib/auth/user";
import {
  normalizeWorkspaceProfile,
  sanitizeWorkspacePatch,
  validateWorkspacePatch,
  workspacePatchToRow,
  type WorkspaceProfileFieldKey,
} from "@/lib/workspaces/profile";

function profileResponse(workspace: typeof workspaces.$inferSelect) {
  return {
    profile: normalizeWorkspaceProfile(workspace),
    workspace: toPublicWorkspace(workspace),
  };
}

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspace = await selectOne(
    db.select().from(workspaces).where(eq(workspaces.id, session.workspace.id)),
  );
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json(profileResponse(workspace));
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<Record<WorkspaceProfileFieldKey, string>>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const patch = sanitizeWorkspacePatch(body);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No workspace fields provided" }, { status: 400 });
  }

  const db = await getDb();
  const currentRow = await selectOne(
    db.select().from(workspaces).where(eq(workspaces.id, session.workspace.id)),
  );
  if (!currentRow) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const current = normalizeWorkspaceProfile(currentRow);
  const errors = validateWorkspacePatch(patch, current);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  const updates = workspacePatchToRow(patch, current);
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Invalid workspace update" }, { status: 400 });
  }

  await db.update(workspaces).set(updates).where(eq(workspaces.id, session.workspace.id));

  const workspace = await selectOne(
    db.select().from(workspaces).where(eq(workspaces.id, session.workspace.id)),
  );
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json(profileResponse(workspace));
}
