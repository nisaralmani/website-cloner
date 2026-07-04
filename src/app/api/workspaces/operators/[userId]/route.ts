import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { users, workspaceMembers } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toWorkspaceOperator } from "@/lib/workspaces/operators";

type RouteContext = { params: Promise<{ userId: string }> };

const VALID_ROLES = new Set(["owner", "member"]);

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "owner") {
    return NextResponse.json({ error: "Only workspace owners can change roles" }, { status: 403 });
  }

  const { userId } = await context.params;
  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const role = body.role?.trim();
  if (!role || !VALID_ROLES.has(role)) {
    return NextResponse.json({ error: "role must be owner or member" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const membership = await selectOne(
    db
      .select()
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)),
      ),
  );

  if (!membership) {
    return NextResponse.json({ error: "Operator not found" }, { status: 404 });
  }

  if (membership.role === "owner" && role !== "owner") {
    return NextResponse.json({ error: "Workspace owners cannot be demoted" }, { status: 403 });
  }

  await db
    .update(workspaceMembers)
    .set({ role })
    .where(
      and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)),
    );

  const user = await selectOne(db.select().from(users).where(eq(users.id, userId)));
  if (!user) {
    return NextResponse.json({ error: "Operator not found" }, { status: 404 });
  }

  return NextResponse.json({
    operator: toWorkspaceOperator({ userId, role, user }, session.user.id),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await context.params;
  const db = await getDb();
  const workspaceId = session.workspace.id;

  const membership = await selectOne(
    db
      .select()
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)),
      ),
  );

  if (!membership) {
    return NextResponse.json({ error: "Operator not found" }, { status: 404 });
  }

  if (membership.role === "owner") {
    return NextResponse.json({ error: "Workspace owners cannot be removed" }, { status: 403 });
  }

  const requesterIsOwner = session.role === "owner";
  const removingSelf = session.user.id === userId;
  if (!requesterIsOwner && !removingSelf) {
    return NextResponse.json({ error: "Only workspace owners can remove operators" }, { status: 403 });
  }

  await db
    .delete(workspaceMembers)
    .where(
      and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)),
    );

  return NextResponse.json({ ok: true, userId });
}
