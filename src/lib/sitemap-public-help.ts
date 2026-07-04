import type { MetadataRoute } from "next";
import { and, asc, eq } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import { helpdeskArticles } from "@/db/schema";
import { helpArticleUrl } from "@/lib/docs-links";
import { resolveWorkspaceForChatbox } from "@/lib/chatbox/visitor-session";
import { PUBLIC_HELPDESK_DOMAIN } from "@/lib/public-helpdesk";

export async function getPublicHelpArticleSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const db = await getDb();
    const workspace = await resolveWorkspaceForChatbox(db, { domain: PUBLIC_HELPDESK_DOMAIN });
    if (!workspace) return [];

    const rows = await selectAll(
      db
        .select({ id: helpdeskArticles.id })
        .from(helpdeskArticles)
        .where(
          and(
            eq(helpdeskArticles.workspaceId, workspace.id),
            eq(helpdeskArticles.status, "visible"),
          ),
        )
        .orderBy(asc(helpdeskArticles.sortOrder)),
    );

    const now = new Date();
    return rows.map((row) => ({
      url: helpArticleUrl(row.id),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch {
    return [];
  }
}
