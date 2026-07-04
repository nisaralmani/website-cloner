import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { getDb } from "@/db/client";
import { users, workspaceAuditLogs, workspaceMembers } from "@/db/schema";
import { operatorDisplayName } from "@/lib/workspaces/operators";
import type { WorkspaceAuditLog } from "@/types/workspace-transparency";
import { toWorkspaceAuditLog } from "@/lib/transparency/mappers";
import {
  AUDIT_ACTION_FILTER_ALL,
  AUDIT_ACTIONS,
  AUDIT_OPERATOR_FILTER_ALL,
} from "@/lib/transparency/validation";

type TransparencyFilters = {
  operatorId: string;
  action: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export async function listWorkspaceAuditLogs(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
  filters: TransparencyFilters,
): Promise<WorkspaceAuditLog[]> {
  const conditions = [eq(workspaceAuditLogs.workspaceId, workspaceId)];

  if (filters.operatorId !== AUDIT_OPERATOR_FILTER_ALL) {
    conditions.push(eq(workspaceAuditLogs.userId, filters.operatorId));
  }

  if (filters.action !== AUDIT_ACTION_FILTER_ALL) {
    conditions.push(eq(workspaceAuditLogs.action, filters.action));
  }

  if (filters.dateFrom) {
    conditions.push(gte(workspaceAuditLogs.createdAt, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(workspaceAuditLogs.createdAt, filters.dateTo));
  }

  const rows = await db
    .select({
      log: workspaceAuditLogs,
      user: users,
    })
    .from(workspaceAuditLogs)
    .innerJoin(users, eq(workspaceAuditLogs.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(workspaceAuditLogs.createdAt));

  return rows.map((row) => toWorkspaceAuditLog({ ...row.log, user: row.user }));
}

export async function listTransparencyOperatorOptions(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const rows = await db
    .select({ user: users })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(asc(users.name), asc(users.email));

  return rows.map((row) => ({
    userId: row.user.id,
    name: operatorDisplayName(row.user),
  }));
}

export async function listTransparencyActionOptions(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const rows = await db
    .selectDistinct({ action: workspaceAuditLogs.action })
    .from(workspaceAuditLogs)
    .where(eq(workspaceAuditLogs.workspaceId, workspaceId))
    .orderBy(asc(workspaceAuditLogs.action));

  const fromLogs = rows.map((row) => row.action);
  const merged: string[] = [...AUDIT_ACTIONS];
  for (const action of fromLogs) {
    if (!merged.includes(action)) {
      merged.push(action);
    }
  }
  return merged;
}

export async function countWorkspaceAuditLogs(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const result = await db
    .select({ value: sql<number>`count(*)` })
    .from(workspaceAuditLogs)
    .where(eq(workspaceAuditLogs.workspaceId, workspaceId));

  return Number(result[0]?.value ?? 0);
}
