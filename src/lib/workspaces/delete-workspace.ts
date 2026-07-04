import { eq, inArray } from "drizzle-orm";
import type { getDb } from "@/db/client";
import {
  campaignTemplates,
  campaigns,
  chatboxRestrictions,
  contacts,
  conversations,
  helpdeskArticles,
  helpdeskCategories,
  messageShortcuts,
  messages,
  routingRules,
  searchAiFrequentSearches,
  subInboxes,
  triageRules,
  visitors,
  workspaceApiTokens,
  workspaceAuditLogs,
  workspaceMembers,
  workspacePlugins,
  workspaceSettings,
  workspaces,
  workspaceSubscriptions,
  workspaceWebhooks,
} from "@/db/schema";

export async function deleteWorkspaceCascade(
  db: Awaited<ReturnType<typeof getDb>>,
  workspaceId: string,
) {
  const conversationRows = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.workspaceId, workspaceId));
  const conversationIds = conversationRows.map((row) => row.id);

  if (conversationIds.length > 0) {
    await db.delete(messages).where(inArray(messages.conversationId, conversationIds));
  }

  await db.delete(conversations).where(eq(conversations.workspaceId, workspaceId));
  await db.delete(visitors).where(eq(visitors.workspaceId, workspaceId));
  await db.delete(contacts).where(eq(contacts.workspaceId, workspaceId));
  await db.delete(campaigns).where(eq(campaigns.workspaceId, workspaceId));
  await db.delete(campaignTemplates).where(eq(campaignTemplates.workspaceId, workspaceId));
  await db.delete(helpdeskArticles).where(eq(helpdeskArticles.workspaceId, workspaceId));
  await db.delete(helpdeskCategories).where(eq(helpdeskCategories.workspaceId, workspaceId));
  await db.delete(workspacePlugins).where(eq(workspacePlugins.workspaceId, workspaceId));
  await db.delete(workspaceSettings).where(eq(workspaceSettings.workspaceId, workspaceId));
  await db.delete(messageShortcuts).where(eq(messageShortcuts.workspaceId, workspaceId));
  await db.delete(triageRules).where(eq(triageRules.workspaceId, workspaceId));
  await db.delete(subInboxes).where(eq(subInboxes.workspaceId, workspaceId));
  await db.delete(routingRules).where(eq(routingRules.workspaceId, workspaceId));
  await db.delete(searchAiFrequentSearches).where(eq(searchAiFrequentSearches.workspaceId, workspaceId));
  await db.delete(chatboxRestrictions).where(eq(chatboxRestrictions.workspaceId, workspaceId));
  await db.delete(workspaceSubscriptions).where(eq(workspaceSubscriptions.workspaceId, workspaceId));
  await db.delete(workspaceApiTokens).where(eq(workspaceApiTokens.workspaceId, workspaceId));
  await db.delete(workspaceWebhooks).where(eq(workspaceWebhooks.workspaceId, workspaceId));
  await db.delete(workspaceAuditLogs).where(eq(workspaceAuditLogs.workspaceId, workspaceId));
  await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
}
