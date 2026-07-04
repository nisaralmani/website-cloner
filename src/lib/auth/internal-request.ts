import { requireSession } from "@/lib/auth/request";
import { bindRequestContext, patchRequestContext } from "@/lib/logging/request-context";
import { secretsMatch } from "@/lib/security/constant-time";
import { logSecurityEventForRequest } from "@/lib/security/security-log";
export function internalSecretFromRequest(request: Request): string | null {
  return request.headers.get("X-Bybelt-Internal-Secret")?.trim() || null;
}

export function isValidInternalSecret(request: Request): boolean {
  const secret = process.env.BYBELT_INTERNAL_SECRET?.trim();
  const provided = internalSecretFromRequest(request);
  const valid = secretsMatch(provided, secret);
  // Only audit a real, failed attempt (a header was presented but did not
  // match) — not the common case of an ordinary session request with no header.
  if (!valid && provided) {
    logSecurityEventForRequest(request, {
      type: "invalid_internal_secret",
      detail: "internal secret mismatch",
    });
  }
  return valid;
}

export async function workspaceIdFromInternalOrSession(
  request: Request,
  bodyWorkspaceId?: string,
): Promise<string | null> {
  bindRequestContext(request);

  if (isValidInternalSecret(request)) {
    const workspaceId = bodyWorkspaceId?.trim() || null;
    if (workspaceId) patchRequestContext({ workspaceId });
    return workspaceId;
  }

  const session = await requireSession();
  if (session?.workspace?.id) {
    patchRequestContext({
      workspaceId: session.workspace.id,
      userId: session.user?.id,
      operatorId: session.user?.id,
    });
  }
  return session?.workspace?.id?.trim() || null;
}
export function unauthorizedInternal(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
