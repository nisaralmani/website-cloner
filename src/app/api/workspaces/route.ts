import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
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
import {
  createWorkspaceForUser,
  validateWorkspaceInput,
} from "@/lib/workspaces/create";
import { deleteWorkspaceCascade } from "@/lib/workspaces/delete-workspace";
import {
  buildWorkspaceDangerStatus,
  pickNextWorkspaceId,
} from "@/lib/workspaces/danger";

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const claims = await decodeSessionToken(token);
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (claims.sessionId && (await isUserSessionRevoked(claims.sessionId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await getUserWithWorkspace(claims.userId, claims.workspaceId);
  if (!session?.user || !session.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;
  const role = session.role ?? "member";

  const status = await buildWorkspaceDangerStatus(
    db,
    claims.userId,
    workspaceId,
    role,
  );
  if (!status.canDelete) {
    return NextResponse.json(
      { error: status.deleteBlockedReason ?? "Unable to delete workspace" },
      { status: 403 },
    );
  }

  const workspacesBefore = await listUserWorkspaces(claims.userId);
  const nextWorkspaceId = pickNextWorkspaceId(workspacesBefore, workspaceId);
  if (!nextWorkspaceId) {
    return NextResponse.json({ error: "No alternate workspace available" }, { status: 409 });
  }

  await deleteWorkspaceCascade(db, workspaceId);

  const nextSession = await getUserWithWorkspace(claims.userId, nextWorkspaceId);
  if (!nextSession?.user || !nextSession.workspace) {
    return NextResponse.json({ error: "Unable to load workspace after delete" }, { status: 500 });
  }

  const workspaces = await listUserWorkspaces(claims.userId);
  const nextToken = await createSessionToken(
    claims.userId,
    SESSION_MAX_AGE_SECONDS,
    nextWorkspaceId,
    claims.sessionId ?? undefined,
  );

  const response = NextResponse.json({
    action: "delete" as const,
    workspace: toPublicWorkspace(nextSession.workspace),
    workspaces,
    user: toPublicUser(nextSession.user),
  });
  response.cookies.set(SESSION_COOKIE, nextToken, sessionCookieOptions());
  return response;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const claims = await decodeSessionToken(token);
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (claims.sessionId && (await isUserSessionRevoked(claims.sessionId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; domain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validated = validateWorkspaceInput(body.name ?? "", body.domain ?? "");
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const workspaceId = await createWorkspaceForUser(
    claims.userId,
    validated.name,
    validated.domain,
  );

  const session = await getUserWithWorkspace(claims.userId, workspaceId);
  if (!session?.user || !session.workspace) {
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }

  const workspaces = await listUserWorkspaces(claims.userId);
  const nextToken = await createSessionToken(
    claims.userId,
    SESSION_MAX_AGE_SECONDS,
    workspaceId,
    claims.sessionId ?? undefined,
  );

  const response = NextResponse.json({
    workspace: toPublicWorkspace(session.workspace),
    workspaces,
    user: toPublicUser(session.user),
  });
  response.cookies.set(SESSION_COOKIE, nextToken, sessionCookieOptions());
  return response;
}
