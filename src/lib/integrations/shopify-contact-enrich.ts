import type { AppDatabase } from "@/db/client";

import { resolveOrderContext } from "@/lib/integrations/order-context-resolver";

import { enrichShopifyCustomerInbox } from "@/lib/integrations/shopify-inbox-enrich";

import { upsertShopifyContact } from "@/lib/contacts/shopify-sync";

import { publishConversationUpdated } from "@/lib/inbox/event-bus";

import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";



type EnrichOptions = {

  conversationId?: string;

};



export async function enrichContactFromShopify(

  db: AppDatabase,

  workspaceId: string,

  email: string,

  options?: EnrichOptions,

) {

  const context = (await resolveOrderContext({ workspaceId, email })).live?.response ?? null;

  if (!context?.linked) {

    return { linked: false as const, matched: false as const };

  }



  if (!("customer" in context) || !context.customer) {

    return { linked: true as const, matched: false as const };

  }



  const customer = context.customer;

  const result = await upsertShopifyContact(db, workspaceId, {

    name: customer.displayName,

    email: customer.email ?? email,

    location: customer.location ?? undefined,

    company: "Shopify",

  });



  const conversationsUpdated = await enrichShopifyCustomerInbox(

    db,

    workspaceId,

    customer.email ?? email,

    customer,

    context.shop,

    "shopName" in context ? context.shopName ?? undefined : undefined,

  );



  if (conversationsUpdated > 0 || options?.conversationId) {

    const conversationList = await fetchWorkspaceConversations(workspaceId);

    publishConversationUpdated(workspaceId, conversationList);

  }



  if (!result.ok) {

    return {

      linked: true as const,

      matched: true as const,

      synced: false as const,

      conversationsUpdated,

    };

  }



  return {

    linked: true as const,

    matched: true as const,

    synced: true as const,

    created: result.created,

    updated: result.updated,

    contactId: result.contact.id,

    conversationsUpdated,

  };

}


