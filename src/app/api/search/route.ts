import { NextResponse } from "next/server";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb, selectAll } from "@/db/client";
import {
  contacts,
  conversations,
  campaigns,
  helpdeskArticles,
  messageShortcuts,
  pluginCatalog,
  workspacePlugins,
} from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { toConversation } from "@/lib/inbox/mappers";
import { toContact } from "@/lib/contacts/mappers";
import { toPlugin } from "@/lib/plugins/mappers";
import {
  searchQuickNavigation,
  searchSettingsPages,
} from "@/lib/search/navigation";
import { listLiveVisitors } from "@/lib/visitors/live-query";
import {
  APP_CAMPAIGNS_PATH,
  APP_CONTACTS_PATH,
  APP_HELPDESK_PATH,
  APP_PLUGINS_PATH,
  APP_VISITORS_PATH,
  appInboxConversationPath,
  appSettingsPath,
} from "@/lib/marketing-paths";
import type { SearchResult } from "@/types/search";

const LIMIT = 8;

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const workspaceId = session.workspace.id;
  const db = await getDb();

  const conversationRows = await selectAll(
    db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          query
            ? or(
                sql`lower(${conversations.name}) like ${`%${query}%`}`,
                sql`lower(${conversations.preview}) like ${`%${query}%`}`,
              )
            : undefined,
        ),
      )
      .orderBy(asc(conversations.sortOrder))
      .limit(LIMIT),
  );

  const conversationResults: SearchResult[] = conversationRows.map((row) => {
    const conversation = toConversation(row);
    return {
      id: conversation.id,
      kind: "conversation",
      title: conversation.name,
      subtitle: conversation.preview,
      href: appInboxConversationPath(conversation.id),
    };
  });

  const contactResults: SearchResult[] = query
    ? (
        await selectAll(
          db
            .select()
            .from(contacts)
            .where(
              and(
                eq(contacts.workspaceId, workspaceId),
                or(
                  sql`lower(${contacts.name}) like ${`%${query}%`}`,
                  sql`lower(${contacts.email}) like ${`%${query}%`}`,
                  sql`lower(${contacts.location}) like ${`%${query}%`}`,
                ),
              ),
            )
            .orderBy(asc(contacts.sortOrder))
            .limit(LIMIT),
        )
      ).map((row) => {
        const contact = toContact(row);
        return {
          id: contact.id,
          kind: "contact" as const,
          title: contact.name,
          subtitle: contact.email,
          href: APP_CONTACTS_PATH,
        };
      })
    : [];

  const installs = await selectAll(
    db
      .select({ pluginId: workspacePlugins.pluginId })
      .from(workspacePlugins)
      .where(
        and(eq(workspacePlugins.workspaceId, workspaceId), eq(workspacePlugins.installed, 1)),
      ),
  );
  const installedIds = new Set(installs.map((row) => row.pluginId));

  const pluginResults: SearchResult[] = query
    ? (
        await selectAll(
          db
            .select()
            .from(pluginCatalog)
            .where(
              or(
                sql`lower(${pluginCatalog.name}) like ${`%${query}%`}`,
                sql`lower(${pluginCatalog.description}) like ${`%${query}%`}`,
              ),
            )
            .orderBy(asc(pluginCatalog.sortOrder))
            .limit(LIMIT),
        )
      ).map((row) => {
        const plugin = toPlugin(row, installedIds.has(row.id));
        return {
          id: plugin.id,
          kind: "plugin" as const,
          title: plugin.name,
          subtitle: plugin.installed ? "Installed" : plugin.description,
          href: APP_PLUGINS_PATH,
        };
      })
    : [];

  const settingsResults = searchSettingsPages(query, LIMIT);
  const navigationResults = searchQuickNavigation(query, LIMIT);

  const campaignResults: SearchResult[] = query
    ? (
        await selectAll(
          db
            .select()
            .from(campaigns)
            .where(
              and(
                eq(campaigns.workspaceId, workspaceId),
                sql`lower(${campaigns.name}) like ${`%${query}%`}`,
              ),
            )
            .orderBy(asc(campaigns.sortOrder))
            .limit(LIMIT),
        )
      ).map((row) => ({
        id: row.id,
        kind: "campaign" as const,
        title: row.name,
        subtitle: row.status,
        href: APP_CAMPAIGNS_PATH,
      }))
    : [];

  const helpdeskResults: SearchResult[] = query
    ? (
        await selectAll(
          db
            .select()
            .from(helpdeskArticles)
            .where(
              and(
                eq(helpdeskArticles.workspaceId, workspaceId),
                sql`lower(${helpdeskArticles.title}) like ${`%${query}%`}`,
              ),
            )
            .orderBy(asc(helpdeskArticles.sortOrder))
            .limit(LIMIT),
        )
      ).map((row) => ({
        id: row.id,
        kind: "helpdesk" as const,
        title: row.title,
        subtitle: row.status,
        href: APP_HELPDESK_PATH,
      }))
    : [];

  const visitorResults: SearchResult[] = query
    ? (
        await listLiveVisitors(db, workspaceId, query)
      ).visitors.slice(0, LIMIT).map((row) => ({
        id: row.id,
        kind: "visitor" as const,
        title: row.name,
        subtitle: row.currentPage,
        href: APP_VISITORS_PATH,
      }))
    : [];

  const messageShortcutResults: SearchResult[] = query
    ? (
        await selectAll(
          db
            .select()
            .from(messageShortcuts)
            .where(
              and(
                eq(messageShortcuts.workspaceId, workspaceId),
                or(
                  sql`lower(${messageShortcuts.bang}) like ${`%${query}%`}`,
                  sql`lower(${messageShortcuts.message}) like ${`%${query}%`}`,
                ),
              ),
            )
            .orderBy(asc(messageShortcuts.sortOrder))
            .limit(LIMIT),
        )
      ).map((row) => ({
        id: row.id,
        kind: "messageShortcut" as const,
        title: row.bang,
        subtitle: row.message,
        href: appSettingsPath("inbox/shortcuts"),
      }))
    : [];

  return NextResponse.json({
    query,
    conversations: conversationResults,
    contacts: contactResults,
    plugins: pluginResults,
    settings: settingsResults,
    navigation: navigationResults,
    campaigns: campaignResults,
    helpdesk: helpdeskResults,
    visitors: visitorResults,
    messageShortcuts: messageShortcutResults,
  });
}
