import { and, eq } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { normalizeProfileInput } from "@/lib/auth/profile";
import { toBooleanFlag } from "@/lib/auth/flags";
import { toOperatorPresence } from "@/lib/auth/presence";

export const DEMO_WORKSPACE_ID = "ws-demo-boutique";

export async function listUserWorkspaces(userId: string) {
  const db = await getDb();
  const rows = await selectAll(
    db
      .select({
        workspace: workspaces,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId)),
  );

  return rows.map((row) => ({
    ...toPublicWorkspace(row.workspace),
    role: row.role,
  }));
}

export async function userHasWorkspace(userId: string, workspaceId: string) {
  const db = await getDb();
  const membership = await selectOne(
    db
      .select()
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)),
      ),
  );
  return Boolean(membership);
}

export async function getUserWithWorkspace(userId: string, preferredWorkspaceId?: string | null) {
  const db = await getDb();

  const user = await selectOne(db.select().from(users).where(eq(users.id, userId)));
  if (!user) return null;

  const memberships = await selectAll(
    db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, userId)),
  );
  if (memberships.length === 0) return { user, workspace: null, role: null };

  const membership =
    memberships.find((row) => row.workspaceId === preferredWorkspaceId) ?? memberships[0];

  const workspace = await selectOne(
    db.select().from(workspaces).where(eq(workspaces.id, membership.workspaceId)),
  );

  return {
    user,
    workspace: workspace ?? null,
    role: membership.role,
  };
}

export function toPublicUser(user: typeof users.$inferSelect) {
  const profile = normalizeProfileInput(user);

  return {
    id: user.id,
    email: profile.email,
    name: profile.name,
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    avatarUrl: user.avatarUrl,
    emailVerified: toBooleanFlag(user.emailVerified),
    avatarGradient: user.avatarGradient,
    presence: toOperatorPresence(user.presenceStatus),
    forceOffline: toBooleanFlag(user.forceOffline),
    autoAvailable: toBooleanFlag(user.autoAvailable),
  };
}

export function toPublicWorkspace(workspace: typeof workspaces.$inferSelect) {
  return {
    id: workspace.id,
    name: workspace.name,
    domain: workspace.domain,
    initials: workspace.initials,
    logoUrl: workspace.logoUrl,
  };
}
