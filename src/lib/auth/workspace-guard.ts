/**
 * Pure tenant-boundary predicates (Phase 19).
 *
 * Dependency-free (no Next.js, no DB) so it is unit-testable in isolation and
 * safe to import anywhere. The stateful/session-aware helpers live in
 * `@/lib/auth/authorization`; this file holds only the boundary logic.
 */

/**
 * True when `resourceWorkspaceId` belongs to the authenticated
 * `sessionWorkspaceId`. Empty/missing ids never match — a missing scope must
 * fail closed, never grant access.
 */
export function isSameWorkspace(
  sessionWorkspaceId: string | null | undefined,
  resourceWorkspaceId: string | null | undefined,
): boolean {
  if (typeof sessionWorkspaceId !== "string" || sessionWorkspaceId.length === 0) return false;
  if (typeof resourceWorkspaceId !== "string" || resourceWorkspaceId.length === 0) return false;
  return sessionWorkspaceId === resourceWorkspaceId;
}

/**
 * Assert that a resource belongs to the session's workspace. Returns the
 * boolean result of {@link isSameWorkspace} — callers translate `false` into a
 * 403 and (typically) a security-audit event.
 */
export function assertWorkspaceOwnership(
  sessionWorkspaceId: string | null | undefined,
  resourceWorkspaceId: string | null | undefined,
): boolean {
  return isSameWorkspace(sessionWorkspaceId, resourceWorkspaceId);
}
