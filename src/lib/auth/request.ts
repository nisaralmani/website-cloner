import { cookies } from "next/headers";
import { decodeSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { isUserSessionRevoked, touchUserSession } from "@/lib/auth/user-sessions";
import { getUserWithWorkspace } from "@/lib/auth/user";

export async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await decodeSessionToken(token);
  if (!claims) return null;

  if (claims.sessionId) {
    if (await isUserSessionRevoked(claims.sessionId)) {
      return null;
    }
    void touchUserSession(claims.sessionId);
  }

  const session = await getUserWithWorkspace(claims.userId, claims.workspaceId);
  if (!session?.user || !session.workspace) return null;

  return session;
}

export async function readSessionClaims() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSessionToken(token);
}
