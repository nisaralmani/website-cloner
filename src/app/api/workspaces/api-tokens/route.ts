import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { workspaceApiTokens } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import {
  defaultApiTokenLabel,
  generateApiTokenPlain,
  toCreatedWorkspaceApiToken,
  toWorkspaceApiToken,
  tokenPreviewFromPlain,
} from "@/lib/workspaces/api-tokens";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const rows = await selectAll(
    db
      .select()
      .from(workspaceApiTokens)
      .where(eq(workspaceApiTokens.workspaceId, session.workspace.id))
      .orderBy(asc(workspaceApiTokens.createdAt)),
  );

  return NextResponse.json({
    tokens: rows.map(toWorkspaceApiToken),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { label?: string } = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as { label?: string };
    }
  } catch {
    // Empty body is allowed.
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;
  const existing = await selectAll(
    db.select().from(workspaceApiTokens).where(eq(workspaceApiTokens.workspaceId, workspaceId)),
  );

  const label = (body.label ?? defaultApiTokenLabel(existing.length)).trim();
  if (!label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const plainToken = generateApiTokenPlain();
  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(workspaceApiTokens).values({
    id,
    workspaceId,
    label,
    tokenPreview: tokenPreviewFromPlain(plainToken),
    createdAt,
  });

  return NextResponse.json(
    {
      token: toCreatedWorkspaceApiToken(
        {
          id,
          workspaceId,
          label,
          tokenPreview: tokenPreviewFromPlain(plainToken),
          createdAt,
        },
        plainToken,
      ),
    },
    { status: 201 },
  );
}
