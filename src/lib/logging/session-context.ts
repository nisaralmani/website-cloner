/**
 * Session-aware request context binding (Phase 24B).
 *
 * Call at the start of authenticated API routes to bind correlation context
 * without regenerating the request id (middleware already forwarded it).
 */

import { requireSession } from "@/lib/auth/request";
import { bindRequestContext, patchRequestContext } from "@/lib/logging/request-context";

export async function bindSessionRequestContext(request: Request) {
  bindRequestContext(request);
  const session = await requireSession();
  if (session?.workspace && session.user) {
    patchRequestContext({
      workspaceId: session.workspace.id,
      userId: session.user.id,
      operatorId: session.user.id,
    });
  }
  return session;
}
