import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { pluginCatalog, workspacePlugins } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toPlugin } from "@/lib/plugins/mappers";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { installed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.installed !== "boolean") {
    return NextResponse.json({ error: "installed boolean is required" }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const catalogRow = await selectOne(
    db.select().from(pluginCatalog).where(eq(pluginCatalog.id, id)),
  );
  if (!catalogRow) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  const existing = await selectOne(
    db
      .select()
      .from(workspacePlugins)
      .where(
        and(eq(workspacePlugins.workspaceId, workspaceId), eq(workspacePlugins.pluginId, id)),
      ),
  );

  if (body.installed) {
    if (existing) {
      await db
        .update(workspacePlugins)
        .set({ installed: 1, installedAt: new Date() })
        .where(
          and(
            eq(workspacePlugins.workspaceId, workspaceId),
            eq(workspacePlugins.pluginId, id),
          ),
        );
    } else {
      await db.insert(workspacePlugins).values({
        workspaceId,
        pluginId: id,
        installed: 1,
        installedAt: new Date(),
      });
    }
  } else if (existing) {
    await db
      .update(workspacePlugins)
      .set({ installed: 0 })
      .where(
        and(eq(workspacePlugins.workspaceId, workspaceId), eq(workspacePlugins.pluginId, id)),
      );
  }

  return NextResponse.json({
    plugin: toPlugin(catalogRow, body.installed),
  });
}
