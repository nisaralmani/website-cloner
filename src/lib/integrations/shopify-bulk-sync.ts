import type { AppDatabase } from "@/db/client";
import { syncShopifyContacts } from "@/lib/contacts/shopify-sync";
import { fetchShopifyCustomersForSync } from "@/lib/integrations/shopify-customers";
import { fetchShopifyWorkspaceStatus } from "@/lib/integrations/shopify-context";
import { tagShopifySegmentForSyncedEmails } from "@/lib/integrations/shopify-inbox-enrich";
import { publishConversationUpdated } from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { recordShopifyContactSync } from "@/lib/integrations/shopify-sync-status";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";

export type ShopifyBulkSyncResult = {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  conversationsTagged: number;
};

export type ShopifyBulkSyncOutcome =
  | ({ ok: true } & ShopifyBulkSyncResult)
  | { ok: false; error: string };

export async function runShopifyBulkContactSync(
  db: AppDatabase,
  workspaceId: string,
  options?: { publishInbox?: boolean; notifyWebhook?: boolean },
): Promise<ShopifyBulkSyncOutcome> {
  const fetchResult = await fetchShopifyCustomersForSync(workspaceId);
  if (!fetchResult.ok) {
    return { ok: false, error: fetchResult.error };
  }
  const customers = fetchResult.customers;

  const result = await syncShopifyContacts(db, workspaceId, customers);
  const shopifyStatus = await fetchShopifyWorkspaceStatus(workspaceId);
  const conversationsTagged = await tagShopifySegmentForSyncedEmails(
    db,
    workspaceId,
    customers.map((customer) => customer.email),
    shopifyStatus?.shop,
  );

  if (conversationsTagged > 0 && options?.publishInbox !== false) {
    const conversationList = await fetchWorkspaceConversations(workspaceId);
    publishConversationUpdated(workspaceId, conversationList);
  }

  void recordShopifyContactSync(workspaceId, {
    created: result.created,
    updated: result.updated,
    total: result.total,
  });

  if (options?.notifyWebhook !== false) {
    void deliverWorkspaceWebhooks(db, workspaceId, "integration:shopify_sync", {
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      total: result.total,
      conversationsTagged,
    });
  }

  return { ok: true, ...result, conversationsTagged };
}
