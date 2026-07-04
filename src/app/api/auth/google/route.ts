import { NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  isGoogleAuthConfigured,
} from "@/lib/auth/google";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  createOAuthState,
  oauthStateCookieOptions,
  sanitizeNextPath,
} from "@/lib/auth/oauth";

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json({ error: "Google sign-in is not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const state = createOAuthState();
  const next = sanitizeNextPath(url.searchParams.get("next"));
  const origin = url.origin;

  const response = NextResponse.redirect(buildGoogleAuthUrl(origin, state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions());
  response.cookies.set(OAUTH_NEXT_COOKIE, next, oauthStateCookieOptions());
  return response;
}
