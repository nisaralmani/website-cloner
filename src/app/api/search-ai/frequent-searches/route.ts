import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { searchAiFrequentSearches, workspacePlugins } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { OVERLAY_PLUGIN_ID } from "@/lib/chatbox/search-ai-preferences";
import { toSearchAiFrequentSearch } from "@/lib/search-ai/mappers";
import {
  defaultFrequentSearchQuery,
  validateFrequentSearchQuery,
} from "@/lib/search-ai/validation";

async function overlayInstalledForWorkspace(db: Awaited<ReturnType<typeof getDb>>, workspaceId: string) {
  const install = await selectOne(
    db
      .select()
      .from(workspacePlugins)
      .where(
        and(
          eq(workspacePlugins.workspaceId, workspaceId),
          eq(workspacePlugins.pluginId, OVERLAY_PLUGIN_ID),
          eq(workspacePlugins.installed, 1),
        ),
      ),
  );

  return Boolean(install);
}

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = session.workspace.id;
  const db = await getDb();

  const rows = await selectAll(
    db
      .select()
      .from(searchAiFrequentSearches)
      .where(eq(searchAiFrequentSearches.workspaceId, workspaceId))
      .orderBy(asc(searchAiFrequentSearches.sortOrder), asc(searchAiFrequentSearches.query)),
  );

  return NextResponse.json({
    searches: rows.map(toSearchAiFrequentSearch),
    overlayInstalled: await overlayInstalledForWorkspace(db, workspaceId),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  if (!(await overlayInstalledForWorkspace(db, workspaceId))) {
    return NextResponse.json({ error: "Overlay plugin is not installed" }, { status: 403 });
  }

  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const existingRows = await selectAll(
    db
      .select({ sortOrder: searchAiFrequentSearches.sortOrder })
      .from(searchAiFrequentSearches)
      .where(eq(searchAiFrequentSearches.workspaceId, workspaceId))
      .orderBy(asc(searchAiFrequentSearches.sortOrder)),
  );

  const query = (body.query ?? defaultFrequentSearchQuery(existingRows.length)).trim();
  const queryError = validateFrequentSearchQuery(query);
  if (queryError) {
    return NextResponse.json({ error: queryError }, { status: 400 });
  }

  const nextSortOrder =
    existingRows.length > 0 ? existingRows[existingRows.length - 1]!.sortOrder + 1 : 0;
  const id = randomUUID();
  const createdAt = new Date();

  await db.insert(searchAiFrequentSearches).values({
    id,
    workspaceId,
    query,
    sortOrder: nextSortOrder,
    createdAt,
  });

  return NextResponse.json(
    {
      search: {
        id,
        query,
        createdAt: createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
