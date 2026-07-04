import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  decodeSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { revokeUserSession } from "@/lib/auth/user-sessions";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const claims = await decodeSessionToken(token);
    if (claims?.sessionId) {
      await revokeUserSession(claims.sessionId, claims.userId);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
