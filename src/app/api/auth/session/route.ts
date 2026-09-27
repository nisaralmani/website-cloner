import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request";
import { listUserWorkspaces, toPublicUser, toPublicWorkspace } from "@/lib/auth/user";

export async function GET() {
  const session = await requireSession();
  if (!session?.user || !session.workspace) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const workspaces = await listUserWorkspaces(session.user.id);

  return NextResponse.json({
    authenticated: true,
    user: toPublicUser(session.user),
    workspace: toPublicWorkspace(session.workspace),
    workspaces,
  });
}
