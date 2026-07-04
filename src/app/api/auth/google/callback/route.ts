import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
  isGoogleAuthConfigured,
} from "@/lib/auth/google";
import { fromBooleanFlag } from "@/lib/auth/flags";
import { resolveGoogleUser } from "@/lib/auth/google-user";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
  sanitizeNextPath,
} from "@/lib/auth/oauth";
import { createSessionForUser } from "@/lib/auth/sign-in";
import { clientMetaFromRequest } from "@/lib/auth/request-meta";
import {
  REMEMBER_MAX_AGE_SECONDS,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";

import { APP_AUTH_LOGIN_PATH } from "@/lib/marketing-paths";

function loginRedirect(request: Request, error: string) {
  const url = new URL(APP_AUTH_LOGIN_PATH, request.url);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_STATE_COOKIE, "", { ...oauthStateCookieOptions(), maxAge: 0 });
  response.cookies.set(OAUTH_NEXT_COOKIE, "", { ...oauthStateCookieOptions(), maxAge: 0 });
  return response;
}

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return loginRedirect(request, "google_unavailable");
  }

  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return loginRedirect(
      request,
      oauthError === "access_denied" ? "google_denied" : "google_failed",
    );
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const cookieState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return loginRedirect(request, "google_state");
  }

  const next = sanitizeNextPath(cookieStore.get(OAUTH_NEXT_COOKIE)?.value ?? "/");

  try {
    const accessToken = await exchangeGoogleCode(url.origin, code);
    const profile = await fetchGoogleProfile(accessToken);

    if (profile.email_verified === false) {
      return loginRedirect(request, "google_unverified");
    }

    const user = await resolveGoogleUser(profile);
    if (!user) {
      return loginRedirect(request, "google_no_account");
    }

    const db = await getDb();
    await db
      .update(users)
      .set({ emailVerified: fromBooleanFlag(true) })
      .where(eq(users.id, user.id));

    const session = await createSessionForUser(user.id, {
      remember: true,
      meta: clientMetaFromRequest(request),
    });
    if (!session) {
      return loginRedirect(request, "google_no_workspace");
    }

    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.set(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions(REMEMBER_MAX_AGE_SECONDS),
    );
    response.cookies.set(OAUTH_STATE_COOKIE, "", { ...oauthStateCookieOptions(), maxAge: 0 });
    response.cookies.set(OAUTH_NEXT_COOKIE, "", { ...oauthStateCookieOptions(), maxAge: 0 });
    return response;
  } catch {
    return loginRedirect(request, "google_failed");
  }
}
