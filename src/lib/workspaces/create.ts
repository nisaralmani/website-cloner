import { randomUUID } from "crypto";
import { getDb } from "@/db/client";
import { workspaceMembers, workspaces } from "@/db/schema";
import { ensureWorkspaceSubscription } from "@/lib/billing/subscriptions";
import { workspaceInitials } from "@/lib/workspaces/utils";

export { normalizeWorkspaceDomain, validateWorkspaceInput, workspaceInitials } from "@/lib/workspaces/utils";

export async function createWorkspaceForUser(
  userId: string,
  name: string,
  domain: string,
) {
  const workspaceId = randomUUID();
  const db = await getDb();

  await db.insert(workspaces).values({
    id: workspaceId,
    name,
    domain,
    initials: workspaceInitials(name),
    logoUrl: null,
    contactTotal: 0,
    helpdeskEnabled: 0,
    analyticsEnabled: 0,
    analyticsTimezone: "UTC",
  });

  await db.insert(workspaceMembers).values({
    userId,
    workspaceId,
    role: "owner",
  });

  await ensureWorkspaceSubscription(db, workspaceId);

  return workspaceId;
}
