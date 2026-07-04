import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { workspaceWebhooks } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { enabledWebhookFlag, toWorkspaceWebhook } from "@/lib/workspaces/webhooks";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled is required" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const existing = await selectOne(
    db
      .select()
      .from(workspaceWebhooks)
      .where(and(eq(workspaceWebhooks.id, id), eq(workspaceWebhooks.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Web hook not found" }, { status: 404 });
  }

  await db
    .update(workspaceWebhooks)
    .set({ enabled: enabledWebhookFlag(body.enabled) })
    .where(and(eq(workspaceWebhooks.id, id), eq(workspaceWebhooks.workspaceId, workspaceId)));

  return NextResponse.json({
    webhook: toWorkspaceWebhook({
      ...existing,
      enabled: enabledWebhookFlag(body.enabled),
    }),
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
      .from(workspaceWebhooks)
      .where(and(eq(workspaceWebhooks.id, id), eq(workspaceWebhooks.workspaceId, workspaceId))),
  );

  if (!existing) {
    return NextResponse.json({ error: "Web hook not found" }, { status: 404 });
  }

  await db
    .delete(workspaceWebhooks)
    .where(and(eq(workspaceWebhooks.id, id), eq(workspaceWebhooks.workspaceId, workspaceId)));

  return NextResponse.json({ ok: true, id });
}
