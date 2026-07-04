import { NextResponse } from "next/server";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { pluginCatalog, pluginCategories, workspacePlugins } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toPlugin } from "@/lib/plugins/mappers";
import {
  pluginCategoryFromParams,
  pluginFilterFromParams,
} from "@/lib/plugins-routes";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = pluginFilterFromParams(
    searchParams.get("filter"),
    searchParams.get("installed"),
  );
  const category = pluginCategoryFromParams(searchParams.get("category"));
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const installs = await selectAll(
    db
      .select()
      .from(workspacePlugins)
      .where(
        and(
          eq(workspacePlugins.workspaceId, workspaceId),
          eq(workspacePlugins.installed, 1),
        ),
      ),
  );

  const installedIds = new Set(installs.map((row) => row.pluginId));

  const catalogRows = await selectAll(
    db
      .select()
      .from(pluginCatalog)
      .where(
        and(
          category ? eq(pluginCatalog.category, category) : undefined,
          query
            ? or(
                sql`lower(${pluginCatalog.name}) like ${`%${query}%`}`,
                sql`lower(${pluginCatalog.description}) like ${`%${query}%`}`,
              )
            : undefined,
        ),
      )
      .orderBy(asc(pluginCatalog.sortOrder)),
  );

  const plugins = catalogRows
    .map((row) => toPlugin(row, installedIds.has(row.id)))
    .filter((plugin) => (filter === "installed" ? plugin.installed : true));

  const categories = await selectAll(
    db.select().from(pluginCategories).orderBy(asc(pluginCategories.sortOrder)),
  );

  return NextResponse.json({
    plugins,
    categories: categories.map((row) => ({
      id: row.id,
      label: row.label,
      count: row.count,
    })),
    installedCount: installedIds.size,
  });
}
