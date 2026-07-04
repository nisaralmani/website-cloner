import { randomBytes } from "crypto";

export const OAUTH_STATE_COOKIE = "oauth_state";
export const OAUTH_NEXT_COOKIE = "oauth_next";
const OAUTH_COOKIE_MAX_AGE = 60 * 10;

export function createOAuthState() {
  return randomBytes(24).toString("hex");
}

export function oauthStateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  };
}

export function sanitizeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}
