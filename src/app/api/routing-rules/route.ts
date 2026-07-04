import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { routingRules } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { activeRoutingRuleCount, toRoutingRule } from "@/lib/routing-rules/mappers";
import {
  DEFAULT_ROUTING_ACTION,
  defaultRoutingRuleName,
  normalizeAssignTarget,
  validateAssignTarget,
  validateMatchContains,
  validateRoutingAction,
  validateRoutingRuleName,
} from "@/lib/routing-rules/validation";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const workspaceId = session.workspace.id;
  const db = await getDb();

  const rows = await selectAll(
    db
      .select()
      .from(routingRules)
      .where(
        and(
          eq(routingRules.workspaceId, workspaceId),
          query
            ? or(
                sql`lower(${routingRules.name}) like ${`%${query}%`}`,
                sql`lower(${routingRules.action}) like ${`%${query}%`}`,
                sql`lower(coalesce(${routingRules.assignTarget}, '')) like ${`%${query}%`}`,
                sql`lower(coalesce(${routingRules.matchContains}, '')) like ${`%${query}%`}`,
              )
            : undefined,
        ),
      )
      .orderBy(asc(routingRules.sortOrder), asc(routingRules.name)),
  );

  const rules = rows.map(toRoutingRule);

  return NextResponse.json({
    rules,
    activeCount: activeRoutingRuleCount(rules),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const existingRows = await selectAll(
    db
      .select({ sortOrder: routingRules.sortOrder })
      .from(routingRules)
      .where(eq(routingRules.workspaceId, workspaceId))
      .orderBy(asc(routingRules.sortOrder)),
  );

  const name = (body.name ?? defaultRoutingRuleName(existingRows.length)).trim();
  const action = body.action ?? DEFAULT_ROUTING_ACTION;
  const assignTarget = normalizeAssignTarget(body.assignTarget);
  const matchContains = body.matchContains?.trim() || null;
  const enabled = body.enabled ?? true;

  const nameError = validateRoutingRuleName(name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const actionError = validateRoutingAction(action);
  if (actionError) {
    return NextResponse.json({ error: actionError }, { status: 400 });
  }

  const assignTargetError = validateAssignTarget(assignTarget);
  if (assignTargetError) {
    return NextResponse.json({ error: assignTargetError }, { status: 400 });
  }

  const matchError = validateMatchContains(matchContains);
  if (matchError) {
    return NextResponse.json({ error: matchError }, { status: 400 });
  }

  const duplicate = await db
    .select({ id: routingRules.id })
    .from(routingRules)
    .where(and(eq(routingRules.workspaceId, workspaceId), eq(routingRules.name, name)))
    .limit(1);

  if (duplicate.length > 0) {
    return NextResponse.json({ error: "Routing rule name already exists" }, { status: 409 });
  }

  const nextSortOrder =
    existingRows.length > 0 ? existingRows[existingRows.length - 1]!.sortOrder + 1 : 0;
  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(routingRules).values({
    id,
    workspaceId,
    name,
    action,
    assignTarget,
    matchContains,
    enabled: enabled ? 1 : 0,
    sortOrder: nextSortOrder,
    createdAt,
  });

  return NextResponse.json(
    {
      rule: {
        id,
        name,
        action,
        assignTarget,
        matchContains,
        enabled,
        createdAt: createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
