import { and, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll, selectOne } from "@/db/client";
import {
  contacts,
  conversationSegments,
  conversationVisitorData,
  conversations,
} from "@/db/schema";
import {
  findConversationIdsByCustomerEmail,
  SHOPIFY_VISITOR_DATA_KEYS,
} from "@/lib/inbox/shopify-conversation";
import { deleteContact } from "@/lib/contacts/create";
import { toContact } from "@/lib/contacts/mappers";
import { normalizeCustomerEmail } from "@/lib/inbox/customer-email";

export type ShopifyRedactResult = {
  contactsDeleted: number;
  conversationsCleared: number;
  visitorDataRemoved: number;
};

export async function redactShopifyCustomerData(
  db: AppDatabase,
  workspaceId: string,
  email: string,
): Promise<ShopifyRedactResult> {
  const normalized = normalizeCustomerEmail(email);
  if (!normalized) {
    return { contactsDeleted: 0, conversationsCleared: 0, visitorDataRemoved: 0 };
  }

  const contact = await selectOne(
    db
      .select()
      .from(contacts)
      .where(and(eq(contacts.workspaceId, workspaceId), eq(contacts.email, normalized))),
  );

  let contactsDeleted = 0;
  if (contact) {
    const deleted = await deleteContact(db, workspaceId, contact.id);
    if (deleted.ok) contactsDeleted = 1;
  }

  const conversationIds = await findConversationIdsByCustomerEmail(db, workspaceId, normalized);
  let visitorDataRemoved = 0;

  for (const conversationId of conversationIds) {
    await db
      .delete(conversationSegments)
      .where(
        and(
          eq(conversationSegments.conversationId, conversationId),
          eq(conversationSegments.segment, "shopify"),
        ),
      );

    await db
      .delete(conversationVisitorData)
      .where(
        and(
          eq(conversationVisitorData.conversationId, conversationId),
          inArray(conversationVisitorData.dataKey, [...SHOPIFY_VISITOR_DATA_KEYS]),
        ),
      );
    visitorDataRemoved += SHOPIFY_VISITOR_DATA_KEYS.length;

    await db
      .update(conversations)
      .set({ customerEmail: null })
      .where(eq(conversations.id, conversationId));
  }

  return {
    contactsDeleted,
    conversationsCleared: conversationIds.length,
    visitorDataRemoved,
  };
}

export type ShopifyWorkspaceRedactResult = {
  contactsDeleted: number;
  conversationsCleared: number;
  visitorDataRemoved: number;
};

export async function redactShopifyWorkspaceData(
  db: AppDatabase,
  workspaceId: string,
): Promise<ShopifyWorkspaceRedactResult> {
  const contactRows = await selectAll(
    db.select().from(contacts).where(eq(contacts.workspaceId, workspaceId)),
  );

  let contactsDeleted = 0;
  let conversationsCleared = 0;
  let visitorDataRemoved = 0;
  const seenEmails = new Set<string>();

  for (const row of contactRows) {
    const contact = toContact(row);
    if (!contact.segments.includes("shopify")) continue;

    const deleted = await deleteContact(db, workspaceId, row.id);
    if (deleted.ok) contactsDeleted += 1;

    const normalized = normalizeCustomerEmail(contact.email);
    if (!normalized || seenEmails.has(normalized)) continue;
    seenEmails.add(normalized);

    const result = await redactShopifyCustomerData(db, workspaceId, normalized);
    conversationsCleared += result.conversationsCleared;
    visitorDataRemoved += result.visitorDataRemoved;
  }

  const shopifySegmentRows = await selectAll(
    db
      .select({ conversationId: conversationSegments.conversationId })
      .from(conversationSegments)
      .innerJoin(conversations, eq(conversationSegments.conversationId, conversations.id))
      .where(
        and(eq(conversations.workspaceId, workspaceId), eq(conversationSegments.segment, "shopify")),
      ),
  );

  for (const row of shopifySegmentRows) {
    await db
      .delete(conversationSegments)
      .where(
        and(
          eq(conversationSegments.conversationId, row.conversationId),
          eq(conversationSegments.segment, "shopify"),
        ),
      );

    await db
      .delete(conversationVisitorData)
      .where(
        and(
          eq(conversationVisitorData.conversationId, row.conversationId),
          inArray(conversationVisitorData.dataKey, [...SHOPIFY_VISITOR_DATA_KEYS]),
        ),
      );
    visitorDataRemoved += SHOPIFY_VISITOR_DATA_KEYS.length;
  }

  return { contactsDeleted, conversationsCleared, visitorDataRemoved };
}
