import type { Metadata } from "next";
import HelpCenterClient from "@/components/help-center/HelpCenterClient";
import { marketingPageMetadata } from "@/lib/seo-metadata";

import { getDb, selectAll, selectOne } from "@/db/client";
import { helpdeskArticles, workspaces } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { toHelpdeskArticle } from "@/lib/helpdesk/mappers";
import type { HelpdeskArticle } from "@/types/helpdesk";

export const dynamic = "force-dynamic";

export const metadata: Metadata = marketingPageMetadata(
  "Help Center | Bybelt",
  "Find answers, guides, and support resources for Bybelt.",
);

export default async function HelpCenterPage() {
  const db = await getDb();
  const workspace = await selectOne(
    db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.domain, "fashionsis.com")),
  );

  let initialArticles: HelpdeskArticle[] = [];
  if (workspace) {
    const articleRows = await selectAll(
      db
        .select()
        .from(helpdeskArticles)
        .where(
          and(
            eq(helpdeskArticles.workspaceId, workspace.id),
            eq(helpdeskArticles.status, "visible"),
          ),
        )
        .orderBy(asc(helpdeskArticles.sortOrder)),
    );
    initialArticles = articleRows.map(toHelpdeskArticle);
  }

  return <HelpCenterClient initialArticles={JSON.parse(JSON.stringify(initialArticles))} />;
}
