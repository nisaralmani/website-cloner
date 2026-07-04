import { and, count, eq } from "drizzle-orm";
import type { getDb } from "@/db/client";
import { workspaceMembers } from "@/db/schema";
import { listUserWorkspaces } from "@/lib/auth/user";
import type { WorkspaceDangerStatus } from "@/types/workspace-danger";

export async function countWorkspaceOwners(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const result = await db
    .select({ value: count() })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.role, "owner")));

  return Number(result[0]?.value ?? 0);
}

export async function isSoleWorkspaceOwner(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
  userId: string,
  role: string,
) {
  if (role !== "owner") {
    return false;
  }

  const owners = await countWorkspaceOwners(db, workspaceId);
  return owners <= 1;
}

export async function buildWorkspaceDangerStatus(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: string,
  workspaceId: string,
  role: string,
): Promise<WorkspaceDangerStatus> {
  const workspaces = await listUserWorkspaces(userId);
  const workspaceCount = workspaces.length;
  const isOwner = role === "owner";
  const soleOwner = await isSoleWorkspaceOwner(db, workspaceId, userId, role);

  let leaveBlockedReason: string | null = null;
  if (workspaceCount <= 1) {
    leaveBlockedReason = "You must belong to another workspace before leaving this one.";
  } else if (soleOwner) {
    leaveBlockedReason = "Transfer workspace ownership before leaving as the only owner.";
  }

  let deleteBlockedReason: string | null = null;
  if (!isOwner) {
    deleteBlockedReason = "Only workspace owners can delete a workspace.";
  } else if (workspaceCount <= 1) {
    deleteBlockedReason = "Create or join another workspace before deleting this one.";
  }

  return {
    canLeave: leaveBlockedReason === null,
    canDelete: deleteBlockedReason === null,
    leaveBlockedReason,
    deleteBlockedReason,
    isOwner,
    workspaceCount,
  };
}

export function pickNextWorkspaceId(
  workspaces: Awaited<ReturnType<typeof listUserWorkspaces>>,
  currentWorkspaceId: string,
) {
  const alternate = workspaces.find((workspace) => workspace.id !== currentWorkspaceId);
  return alternate?.id ?? null;
}
