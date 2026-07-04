import { randomUUID } from "crypto";
import type { AppDatabase } from "@/db/client";
import { workspaceAuditLogs } from "@/db/schema";
import { isTransparencyCollectionEnabled } from "@/lib/transparency/preferences";

export async function appendWorkspaceAuditLog(
  db: AppDatabase,
  input: {
    workspaceId: string;
    userId: string;
    action: string;
    ipAddress?: string;
    country?: string;
    badge?: string;
  },
) {
  const enabled = await isTransparencyCollectionEnabled(db, input.workspaceId);
  if (!enabled) {
    return;
  }

  await db.insert(workspaceAuditLogs).values({
    id: randomUUID(),
    workspaceId: input.workspaceId,
    userId: input.userId,
    action: input.action,
    badge: input.badge ?? "Write",
    ipAddress: input.ipAddress ?? "127.0.0.1",
    country: input.country ?? "Unknown",
    createdAt: new Date(),
  });
}
