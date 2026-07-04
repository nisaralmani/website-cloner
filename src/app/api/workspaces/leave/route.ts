import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { workspaceMembers } from "@/db/schema";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  decodeSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import {
  getUserWithWorkspace,
  listUserWorkspaces,
  toPublicUser,
  toPublicWorkspace,
} from "@/lib/auth/user";
import { isUserSessionRevoked } from "@/lib/auth/user-sessions";
import { requireSession } from "@/lib/auth/request";
import {
  buildWorkspaceDangerStatus,
  pickNextWorkspaceId,
} from "@/lib/workspaces/danger";

async function sessionResponse(userId: string, workspaceId: string, sessionId?: string) {
  const session = await getUserWithWorkspace(userId, workspaceId);
  if (!session?.user || !session.workspace) {
    return null;
  }

  const workspaces = await listUserWorkspaces(userId);
  const nextToken = await createSessionToken(
    userId,
    SESSION_MAX_AGE_SECONDS,
    workspaceId,
    sessionId,
  );

  const response = NextResponse.json({
    action: "leave" as const,
    workspace: toPublicWorkspace(session.workspace),
    workspaces,
    user: toPublicUser(session.user),
  });
  response.cookies.set(SESSION_COOKIE, nextToken, sessionCookieOptions());
  return response;
}

export async function POST() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const userId = session.user.id;
  const workspaceId = session.workspace.id;
  const role = session.role ?? "member";

  const status = await buildWorkspaceDangerStatus(db, userId, workspaceId, role);
  if (!status.canLeave) {
    return NextResponse.json(
      { error: status.leaveBlockedReason ?? "Unable to leave workspace" },
      { status: 403 },
    );
  }

  const workspacesBefore = await listUserWorkspaces(userId);
  const nextWorkspaceId = pickNextWorkspaceId(workspacesBefore, workspaceId);
  if (!nextWorkspaceId) {
    return NextResponse.json({ error: "No alternate workspace available" }, { status: 409 });
  }

  await db
    .delete(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)));

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const claims = token ? await decodeSessionToken(token) : null;
  if (claims?.sessionId && (await isUserSessionRevoked(claims.sessionId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await sessionResponse(userId, nextWorkspaceId, claims?.sessionId ?? undefined);
  if (!response) {
    return NextResponse.json({ error: "Unable to switch workspace after leave" }, { status: 500 });
  }

  return response;
}
