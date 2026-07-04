/**
 * Centralized workspace authorization (Phase 19).
 *
 * One place to answer "is there an authenticated session, and does it own this
 * workspace/resource?" — replacing the per-route `requireSession()` +
 * `if (!session?.workspace) 401` convention with a reusable helper that also
 * emits security-audit events on failure.
 *
 * Behavior is preserved: `authorizeWorkspace()` returns the same
 * `{ error: "Unauthorized" }` 401 that routes already return, so migrating a
 * route is a drop-in change. It does NOT rewrite every route — high-risk routes
 * adopt it; the rest can migrate incrementally.
 */

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request";
import { assertWorkspaceOwnership } from "@/lib/auth/workspace-guard";
import { logSecurityEventForRequest } from "@/lib/security/security-log";

type Session = NonNullable<Awaited<ReturnType<typeof requireSession>>>;

export type WorkspaceAuthContext = {
  session: Session;
  workspaceId: string;
  userId: string;
  role: string | null;
};

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** Narrow the union returned by the authorize helpers. */
export function isAuthError(value: unknown): value is NextResponse {
  return value instanceof Response;
}

/**
 * Require an authenticated session bound to a workspace. Returns the
 * authorization context on success, or a 401 `NextResponse` on failure (which
 * the caller should return directly).
 */
export async function authorizeWorkspace(
  request?: Request,
): Promise<WorkspaceAuthContext | NextResponse> {
  const session = await requireSession();
  if (!session?.workspace || !session.user) {
    if (request) {
      logSecurityEventForRequest(request, {
        type: "auth_failure",
        detail: "no authenticated workspace session",
      });
    }
    return unauthorized();
  }

  return {
    session,
    workspaceId: session.workspace.id,
    userId: session.user.id,
    role: session.role ?? null,
  };
}

/**
 * Assert the authenticated workspace owns a resource. Returns `null` when the
 * resource is in-tenant (proceed), or a 403 `NextResponse` (and logs an
 * `unauthorized_workspace_access` event) on a cross-tenant attempt.
 */
export function authorizeWorkspaceResource(
  ctx: WorkspaceAuthContext,
  resourceWorkspaceId: string | null | undefined,
  request?: Request,
): NextResponse | null {
  if (assertWorkspaceOwnership(ctx.workspaceId, resourceWorkspaceId)) {
    return null;
  }
  if (request) {
    logSecurityEventForRequest(request, {
      type: "unauthorized_workspace_access",
      workspaceId: ctx.workspaceId,
      detail: `cross-tenant access attempt to workspace ${resourceWorkspaceId ?? "unknown"}`,
    });
  }
  return forbidden();
}
