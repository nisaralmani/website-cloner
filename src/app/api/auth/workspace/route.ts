import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
  userHasWorkspace,
} from "@/lib/auth/user";
import { isUserSessionRevoked } from "@/lib/auth/user-sessions";

async function buildSessionResponse(userId: string, workspaceId: string | null) {
  const session = await getUserWithWorkspace(userId, workspaceId);
  if (!session?.user || !session.workspace) {
    return null;
  }

  const workspaces = await listUserWorkspaces(userId);
  return {
    authenticated: true as const,
    user: toPublicUser(session.user),
    workspace: toPublicWorkspace(session.workspace),
    workspaces,
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const claims = await decodeSessionToken(token);
  if (!claims) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (claims.sessionId && (await isUserSessionRevoked(claims.sessionId))) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await buildSessionResponse(claims.userId, claims.workspaceId);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json(payload);
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

  let body: { workspaceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  if (!(await userHasWorkspace(claims.userId, workspaceId))) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 403 });
  }

  const payload = await buildSessionResponse(claims.userId, workspaceId);
  if (!payload) {
    return NextResponse.json({ error: "Unable to load workspace" }, { status: 500 });
  }

  const nextToken = await createSessionToken(
    claims.userId,
    SESSION_MAX_AGE_SECONDS,
    workspaceId,
    claims.sessionId ?? undefined,
  );

  const response = NextResponse.json(payload);
  response.cookies.set(SESSION_COOKIE, nextToken, sessionCookieOptions());
  return response;
}
