import {
  createSessionToken,
  REMEMBER_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth/session";
import type { UserSessionMeta } from "@/lib/auth/user-sessions";
import { createUserSession } from "@/lib/auth/user-sessions";
import { getUserWithWorkspace, toPublicUser, toPublicWorkspace } from "@/lib/auth/user";

export async function createSessionForUser(
  userId: string,
  options?: { remember?: boolean; meta?: UserSessionMeta },
) {
  const session = await getUserWithWorkspace(userId);
  if (!session?.workspace) {
    return null;
  }

  const sessionId = options?.meta
    ? await createUserSession(userId, options.meta)
    : undefined;

  const maxAge = options?.remember ? REMEMBER_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;
  const token = await createSessionToken(
    userId,
    maxAge,
    session.workspace.id,
    sessionId,
  );
  return {
    token,
    sessionId: sessionId ?? null,
    user: toPublicUser(session.user),
    workspace: toPublicWorkspace(session.workspace),
    maxAge,
  };
}

export { sessionCookieOptions, SESSION_MAX_AGE_SECONDS, REMEMBER_MAX_AGE_SECONDS };
