import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { routingRules } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toRoutingRule } from "@/lib/routing-rules/mappers";
import {
  normalizeAssignTarget,
  validateAssignTarget,
  validateMatchContains,
  validateRoutingAction,
  validateRoutingRuleName,
} from "@/lib/routing-rules/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: {
    name?: string;
    action?: string;
    assignTarget?: string | null;
    matchContains?: string | null;
    enabled?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const existing = await selectOne(
    db
      .select()
      .from(routingRules)
      .where(and(eq(routingRules.id, id), eq(routingRules.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Routing rule not found" }, { status: 404 });
  }

  const nextName = body.name !== undefined ? body.name.trim() : existing.name;
  const nextAction = body.action ?? existing.action;
  const nextAssignTarget =
    body.assignTarget !== undefined
      ? normalizeAssignTarget(body.assignTarget)
      : existing.assignTarget;
  const nextMatchContains =
    body.matchContains !== undefined
      ? body.matchContains?.trim() || null
      : existing.matchContains;
  const nextEnabled =
    body.enabled !== undefined ? (body.enabled ? 1 : 0) : existing.enabled;

  const nameError = validateRoutingRuleName(nextName);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const actionError = validateRoutingAction(nextAction);
  if (actionError) {
    return NextResponse.json({ error: actionError }, { status: 400 });
  }

  const assignTargetError = validateAssignTarget(nextAssignTarget);
  if (assignTargetError) {
    return NextResponse.json({ error: assignTargetError }, { status: 400 });
  }

  const matchError = validateMatchContains(nextMatchContains);
  if (matchError) {
    return NextResponse.json({ error: matchError }, { status: 400 });
  }

  if (nextName !== existing.name) {
    const duplicate = await selectOne(
      db
        .select()
        .from(routingRules)
        .where(and(eq(routingRules.workspaceId, workspaceId), eq(routingRules.name, nextName))),
    );
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json({ error: "Routing rule name already exists" }, { status: 409 });
    }
  }

  await db
    .update(routingRules)
    .set({
      name: nextName,
      action: nextAction,
      assignTarget: nextAssignTarget,
      matchContains: nextMatchContains,
      enabled: nextEnabled,
    })
    .where(and(eq(routingRules.id, id), eq(routingRules.workspaceId, workspaceId)));

  const updated = await selectOne(
    db
      .select()
      .from(routingRules)
      .where(and(eq(routingRules.id, id), eq(routingRules.workspaceId, workspaceId))),
  );

  return NextResponse.json({
    rule: updated ? toRoutingRule(updated) : null,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();
  const workspaceId = session.workspace.id;

  const existing = await selectOne(
    db
      .select()
      .from(routingRules)
      .where(and(eq(routingRules.id, id), eq(routingRules.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Routing rule not found" }, { status: 404 });
  }

  await db
    .delete(routingRules)
    .where(and(eq(routingRules.id, id), eq(routingRules.workspaceId, workspaceId)));

  return NextResponse.json({ ok: true, id });
}
