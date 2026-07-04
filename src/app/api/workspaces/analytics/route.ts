import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { workspaces } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { assertAnalyticsWritesAllowed } from "@/lib/analytics/plan-access";

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { timezone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const timezone = body.timezone?.trim();
  if (!timezone) {
    return NextResponse.json({ error: "timezone is required" }, { status: 400 });
  }

  const db = await getDb();
  const planError = await assertAnalyticsWritesAllowed(db, session.workspace.id);
  if (planError) {
    return NextResponse.json({ error: planError }, { status: 403 });
  }

  await db
    .update(workspaces)
    .set({ analyticsTimezone: timezone })
    .where(eq(workspaces.id, session.workspace.id));

  const workspace = await selectOne(
    db.select().from(workspaces).where(eq(workspaces.id, session.workspace.id)),
  );

  return NextResponse.json({
    timezone: workspace?.analyticsTimezone ?? timezone,
  });
}
