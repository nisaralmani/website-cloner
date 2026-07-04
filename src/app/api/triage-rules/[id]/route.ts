import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { triageRules } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toTriageRule } from "@/lib/triage/mappers";
import {
  validateActionForRuleset,
  validateMatchContains,
  validateRuleName,
} from "@/lib/triage/validation";
import type { TriageRuleset } from "@/types/triage";

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
      .from(triageRules)
      .where(and(eq(triageRules.id, id), eq(triageRules.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Triage rule not found" }, { status: 404 });
  }

  const ruleset = existing.ruleset as TriageRuleset;
  const nextName = body.name !== undefined ? body.name.trim() : existing.name;
  const nextAction = body.action !== undefined ? body.action : existing.action;
  const nextMatchContains =
    body.matchContains !== undefined ? body.matchContains?.trim() || null : existing.matchContains;
  const nextEnabled =
    body.enabled !== undefined ? (body.enabled ? 1 : 0) : existing.enabled;

  const nameError = validateRuleName(nextName);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const actionError = validateActionForRuleset(ruleset, nextAction);
  if (actionError) {
    return NextResponse.json({ error: actionError }, { status: 400 });
  }

  const matchError = validateMatchContains(nextMatchContains);
  if (matchError) {
    return NextResponse.json({ error: matchError }, { status: 400 });
  }

  await db
    .update(triageRules)
    .set({
      name: nextName,
      action: nextAction,
      matchContains: nextMatchContains,
      enabled: nextEnabled,
    })
    .where(and(eq(triageRules.id, id), eq(triageRules.workspaceId, workspaceId)));

  const updated = await selectOne(
    db
      .select()
      .from(triageRules)
      .where(and(eq(triageRules.id, id), eq(triageRules.workspaceId, workspaceId))),
  );

  return NextResponse.json({
    rule: updated ? toTriageRule(updated) : null,
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
      .from(triageRules)
      .where(and(eq(triageRules.id, id), eq(triageRules.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Triage rule not found" }, { status: 404 });
  }

  await db
    .delete(triageRules)
    .where(and(eq(triageRules.id, id), eq(triageRules.workspaceId, workspaceId)));

  return NextResponse.json({ ok: true, id });
}
