import { NextResponse } from "next/server";
import { requireSession, readSessionClaims } from "@/lib/auth/request";
import { listUserWorkspaces, toPublicUser, toPublicWorkspace } from "@/lib/auth/user";

export async function GET() {
  const session = await requireSession();
  if (!session?.user || !session.workspace) {
    const claims = await readSessionClaims();
    // #region agent log
    fetch("http://127.0.0.1:7449/ingest/9dc21598-7fa5-47ad-bcd5-f19cf292aff5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "0c18e7",
      },
      body: JSON.stringify({
        sessionId: "0c18e7",
        runId: "pre-fix",
        hypothesisId: "H2",
        location: "api/auth/session/route.ts:GET",
        message: "session rejected",
        data: {
          hasClaims: Boolean(claims?.userId),
          hasSessionId: Boolean(claims?.sessionId),
          hasUser: Boolean(session?.user),
          hasWorkspace: Boolean(session?.workspace),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
