import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { workspaces } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toPublicWorkspace } from "@/lib/auth/user";
import { normalizeWorkspaceProfile } from "@/lib/workspaces/profile";
import { removeWorkspaceLogoFiles, saveWorkspaceLogo } from "@/lib/workspaces/logo";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "logo file is required" }, { status: 400 });
  }

  const saved = await saveWorkspaceLogo(session.workspace.id, file);
  if ("error" in saved) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }

  const { logoUrl } = saved;

  const db = await getDb();
  await db
    .update(workspaces)
    .set({ logoUrl })
    .where(eq(workspaces.id, session.workspace.id));

  const workspace = await selectOne(
    db.select().from(workspaces).where(eq(workspaces.id, session.workspace.id)),
  );
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({
    logoUrl,
    profile: normalizeWorkspaceProfile(workspace),
    workspace: toPublicWorkspace(workspace),
  });
}

export async function DELETE() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  removeWorkspaceLogoFiles(session.workspace.id);

  const db = await getDb();
  await db
    .update(workspaces)
    .set({ logoUrl: null })
    .where(eq(workspaces.id, session.workspace.id));

  const workspace = await selectOne(
    db.select().from(workspaces).where(eq(workspaces.id, session.workspace.id)),
  );
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({
    logoUrl: null,
    profile: normalizeWorkspaceProfile(workspace),
    workspace: toPublicWorkspace(workspace),
  });
}
