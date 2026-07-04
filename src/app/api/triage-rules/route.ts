import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { triageRules } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { activeCountLabel, splitTriageRules, toTriageRule } from "@/lib/triage/mappers";
import {
  TRIAGE_ACTION_FILTER_ALL,
  defaultActionForRuleset,
  defaultRuleName,
  validateActionForRuleset,
  validateMatchContains,
  validateRuleName,
  validateRuleset,
} from "@/lib/triage/validation";
import type { TriageRuleset } from "@/types/triage";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const action = searchParams.get("action")?.trim() ?? TRIAGE_ACTION_FILTER_ALL;
  const ruleset = searchParams.get("ruleset")?.trim() as TriageRuleset | "" | undefined;
  const workspaceId = session.workspace.id;
  const db = await getDb();

  const rows = await selectAll(
    db
      .select()
      .from(triageRules)
      .where(
        and(
          eq(triageRules.workspaceId, workspaceId),
          ruleset === "block" || ruleset === "sort" ? eq(triageRules.ruleset, ruleset) : undefined,
          action !== TRIAGE_ACTION_FILTER_ALL ? eq(triageRules.action, action) : undefined,
          query
            ? or(
                sql`lower(${triageRules.name}) like ${`%${query}%`}`,
                sql`lower(coalesce(${triageRules.matchContains}, '')) like ${`%${query}%`}`,
                sql`lower(${triageRules.action}) like ${`%${query}%`}`,
              )
            : undefined,
        ),
      )
      .orderBy(asc(triageRules.sortOrder), asc(triageRules.name)),
  );

  const rules = rows.map(toTriageRule);
  const grouped = splitTriageRules(rules);

  return NextResponse.json({
    rules,
    ...grouped,
    blockActiveLabel: activeCountLabel(grouped.blockActiveCount),
    sortActiveLabel: activeCountLabel(grouped.sortActiveCount),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    ruleset?: string;
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

  const ruleset = body.ruleset;
  if (!ruleset) {
    return NextResponse.json({ error: "ruleset is required" }, { status: 400 });
  }

  const rulesetError = validateRuleset(ruleset);
  if (rulesetError) {
    return NextResponse.json({ error: rulesetError }, { status: 400 });
  }

  const typedRuleset = ruleset as TriageRuleset;
  const name = (body.name ?? defaultRuleName(typedRuleset)).trim();
  const action = body.action ?? defaultActionForRuleset(typedRuleset);
  const matchContains = body.matchContains?.trim() || null;
  const enabled = body.enabled ?? true;

  const nameError = validateRuleName(name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const actionError = validateActionForRuleset(typedRuleset, action);
  if (actionError) {
    return NextResponse.json({ error: actionError }, { status: 400 });
  }

  const matchError = validateMatchContains(matchContains);
  if (matchError) {
    return NextResponse.json({ error: matchError }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const sortRows = await selectAll(
    db
      .select({ sortOrder: triageRules.sortOrder })
      .from(triageRules)
      .where(and(eq(triageRules.workspaceId, workspaceId), eq(triageRules.ruleset, typedRuleset)))
      .orderBy(asc(triageRules.sortOrder)),
  );

  const nextSortOrder = sortRows.length > 0 ? sortRows[sortRows.length - 1]!.sortOrder + 1 : 0;
  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(triageRules).values({
    id,
    workspaceId,
    ruleset: typedRuleset,
    name,
    action,
    enabled: enabled ? 1 : 0,
    matchContains,
    sortOrder: nextSortOrder,
    createdAt,
  });

  return NextResponse.json(
    {
      rule: {
        id,
        ruleset: typedRuleset,
        name,
        action,
        enabled,
        matchContains,
        createdAt: createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
