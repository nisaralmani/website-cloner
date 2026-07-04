import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { workspaceMembers } from "@/db/schema";

export function parseAssignedOperatorInput(
  value: unknown,
): { operatorId: string | null } | { error: string } {
  if (value === null) {
    return { operatorId: null };
  }

  if (typeof value !== "string") {
    return { error: "assignedOperatorId must be a string or null" };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { operatorId: null };
  }

  if (trimmed.length > 64) {
    return { error: "assignedOperatorId is too long" };
  }

  return { operatorId: trimmed };
}

export async function isWorkspaceOperator(
  db: AppDatabase,
  workspaceId: string,
  operatorId: string,
): Promise<boolean> {
  const membership = await selectOne(
    db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, operatorId),
        ),
      ),
  );

  return Boolean(membership);
}
