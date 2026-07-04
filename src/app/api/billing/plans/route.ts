import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { paymentMethods, workspaceMembers, workspaceSubscriptions, workspaces } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toWorkspacePlan } from "@/lib/billing/plans";
import { upgradeWorkspacePlan } from "@/lib/billing/upgrade-plan";

export async function GET() {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const userId = session.user.id;

  const rows = await selectAll(
    db
      .select({
        workspace: workspaces,
        subscription: workspaceSubscriptions,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .innerJoin(
        workspaceSubscriptions,
        eq(workspaceSubscriptions.workspaceId, workspaces.id),
      )
      .where(eq(workspaceMembers.userId, userId)),
  );

  const paymentMethodRows = await selectAll(
    db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId)),
  );

  const plans = rows.map((row) => toWorkspacePlan(row.workspace, row.subscription));
  const monthlyTotalCents = rows.reduce(
    (total, row) => total + row.subscription.monthlyCents,
    0,
  );

  return NextResponse.json({
    monthlyTotalCents,
    hasPaymentMethod: paymentMethodRows.length > 0,
    plans,
  });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { workspaceId?: string; planTag?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim() || session.workspace.id;
  if (!body.planTag?.trim()) {
    return NextResponse.json({ error: "planTag is required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await upgradeWorkspacePlan(db, workspaceId, body.planTag);
  if (!result.ok) {
    if ("reason" in result && result.reason === "not_found") {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ plan: result.plan });
}
