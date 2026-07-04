import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bybelt_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type VerifiedSession = {
  userId: string;
  workspaceId: string | null;
  sessionId: string | null;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return new TextEncoder().encode(secret ?? "dev-session-secret-change-me");
}

export async function createSessionToken(
  userId: string,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
  workspaceId?: string,
  sessionId?: string,
) {
  const payload: { sub: string; wid?: string; sid?: string } = { sub: userId };
  if (workspaceId) {
    payload.wid = workspaceId;
  }
  if (sessionId) {
    payload.sid = sessionId;
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecret());
}

export async function decodeSessionToken(token: string): Promise<VerifiedSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.sub;
    if (typeof userId !== "string") return null;
    const workspaceId = payload.wid;
    const sessionId = payload.sid;

    return {
      userId,
      workspaceId: typeof workspaceId === "string" ? workspaceId : null,
      sessionId: typeof sessionId === "string" ? sessionId : null,
    };
  } catch {
    return null;
  }
}

export async function verifySessionToken(token: string): Promise<VerifiedSession | null> {
  return decodeSessionToken(token);
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  const allowInsecureLocal =
    process.env.ALLOW_INSECURE_SESSION_COOKIE === "1" ||
    process.env.SMOKE_BYPASS_AUTH === "1";

  const options: {
    httpOnly: boolean;
    sameSite: "lax";
    secure: boolean;
    path: string;
    maxAge: number;
    domain?: string;
  } = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !allowInsecureLocal,
    path: "/",
    maxAge: maxAgeSeconds,
  };

  if (process.env.NODE_ENV === "production" && !allowInsecureLocal) {
    options.domain = ".bybelt.com";
  }

  return options;
}
