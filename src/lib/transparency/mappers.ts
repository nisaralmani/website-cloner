import type { workspaceAuditLogs, users } from "@/db/schema";
import type { TableRowCell } from "@/lib/settings-data";
import { formatSessionWhen } from "@/lib/auth/session-time";
import { operatorAvatarUrl, operatorDisplayName } from "@/lib/workspaces/operators";
import type { WorkspaceAuditLog } from "@/types/workspace-transparency";

type AuditLogRow = typeof workspaceAuditLogs.$inferSelect & {
  user: typeof users.$inferSelect;
};

export function toWorkspaceAuditLog(row: AuditLogRow, now = new Date()): WorkspaceAuditLog {
  return {
    id: row.id,
    action: row.action,
    badge: row.badge,
    operatorUserId: row.userId,
    operatorName: operatorDisplayName(row.user),
    operatorAvatarUrl: operatorAvatarUrl(row.user),
    ipAddress: row.ipAddress,
    country: row.country,
    createdAt: row.createdAt.toISOString(),
    timeAgoLabel: formatSessionWhen(row.createdAt, now),
  };
}

export function auditLogToTableRow(log: WorkspaceAuditLog): TableRowCell[] {
  return [
    { kind: "auditAction", action: log.action, badge: log.badge },
    {
      kind: "operatorCell",
      name: log.operatorName,
      avatarUrl: log.operatorAvatarUrl,
    },
    { kind: "timeAgo", value: log.timeAgoLabel },
    { kind: "auditIp", country: log.country, ip: log.ipAddress },
    { kind: "spacer" },
  ];
}

export function auditLogsToTableRows(logs: WorkspaceAuditLog[]): TableRowCell[][] {
  return logs.map(auditLogToTableRow);
}
