import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { users, workspaceMembers } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import {
  isOperatorOnline,
  normalizeInviteEmail,
  toWorkspaceOperator,
  validateInviteEmail,
} from "@/lib/workspaces/operators";
import { appendWorkspaceAuditLog } from "@/lib/transparency/append-audit-log";
import { assertOperatorLimit } from "@/lib/workspaces/workspace-data-store";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const rows = await selectAll(
    db
      .select({
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        user: users,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId))
      .orderBy(asc(users.name), asc(users.email)),
  );

  const operators = rows.map((row) => toWorkspaceOperator(row, session.user.id));
  const supportOnline = rows.some((row) => isOperatorOnline(row.user));

  return NextResponse.json({
    operators,
    supportOnline,
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "owner") {
    return NextResponse.json({ error: "Only workspace owners can invite operators" }, { status: 403 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const email = normalizeInviteEmail(body.email);
  const emailError = validateInviteEmail(email);
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const limitError = await assertOperatorLimit(db, workspaceId);
  if (limitError) {
    return NextResponse.json({ error: limitError }, { status: 403 });
  }

  const invitee = await selectOne(db.select().from(users).where(eq(users.email, email)));
  if (!invitee) {
    return NextResponse.json({ error: "No Bybelt account found for this email" }, { status: 404 });
  }

  const existingMembership = await selectOne(
    db
      .select()
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.userId, invitee.id), eq(workspaceMembers.workspaceId, workspaceId)),
      ),
  );

  if (existingMembership) {
    return NextResponse.json({ error: "Operator is already a workspace member" }, { status: 409 });
  }

  await db.insert(workspaceMembers).values({
    userId: invitee.id,
    workspaceId,
    role: "member",
  });

  await appendWorkspaceAuditLog(db, {
    workspaceId,
    userId: session.user.id,
    action: `Invited operator ${email}`,
  });

  const row = {
    userId: invitee.id,
    role: "member",
    user: invitee,
  };

  return NextResponse.json(
    {
      operator: toWorkspaceOperator(row, session.user.id),
    },
    { status: 201 },
  );
}
