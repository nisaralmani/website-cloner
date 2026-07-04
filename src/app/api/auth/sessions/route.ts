import { NextResponse } from "next/server";
import {
  buildSecurityPayload,
  listUserSessions,
  revokeUserSession,
} from "@/lib/auth/user-sessions";
import { readSessionClaims, requireSession } from "@/lib/auth/request";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export async function GET() {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const claims = await readSessionClaims();
  const rows = await listUserSessions(session.user.id);

  return NextResponse.json(buildSecurityPayload(rows, claims?.sessionId ?? null));
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const revoked = await revokeUserSession(sessionId, session.user.id);
  if (!revoked.ok) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const claims = await readSessionClaims();
  const isCurrent = claims?.sessionId === sessionId;

  const rows = await listUserSessions(session.user.id);
  const response = NextResponse.json({
    ok: true,
    currentRevoked: isCurrent,
    ...buildSecurityPayload(rows, isCurrent ? null : claims?.sessionId ?? null),
  });

  if (isCurrent) {
    response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  }

  return response;
}
