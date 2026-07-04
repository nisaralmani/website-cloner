import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { workspaceWebhooks } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import {
  defaultMockWebhookUrl,
  normalizeWebhookUrl,
  toWorkspaceWebhook,
  validateWebhookUrl,
} from "@/lib/workspaces/webhooks";
import { ALL_WEBHOOK_EVENTS, serializeWebhookEvents } from "@/lib/workspaces/webhook-events";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const rows = await selectAll(
    db
      .select()
      .from(workspaceWebhooks)
      .where(eq(workspaceWebhooks.workspaceId, session.workspace.id))
      .orderBy(asc(workspaceWebhooks.createdAt)),
  );

  return NextResponse.json({
    webhooks: rows.map(toWorkspaceWebhook),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: string } = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as { url?: string };
    }
  } catch {
    // Empty body is allowed.
  }

  const url = normalizeWebhookUrl(body.url ?? defaultMockWebhookUrl());
  const urlError = validateWebhookUrl(url);
  if (urlError) {
    return NextResponse.json({ error: urlError }, { status: 400 });
  }

  const db = await getDb();
  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(workspaceWebhooks).values({
    id,
    workspaceId: session.workspace.id,
    url,
    enabled: 1,
    events: serializeWebhookEvents(ALL_WEBHOOK_EVENTS),
    createdAt,
  });

  return NextResponse.json(
    {
      webhook: toWorkspaceWebhook({
        id,
        workspaceId: session.workspace.id,
        url,
        enabled: 1,
        events: serializeWebhookEvents(ALL_WEBHOOK_EVENTS),
        createdAt,
      }),
    },
    { status: 201 },
  );
}
