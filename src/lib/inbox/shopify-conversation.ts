import { randomUUID } from "crypto";
import { and, desc, eq, inArray, max } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectAll } from "@/db/client";
import { conversationSegments, conversationVisitorData, conversations, messages } from "@/db/schema";
import { toApiMessage } from "@/lib/inbox/mappers";
import { formatMessageTime } from "@/lib/inbox/time";
import { normalizeCustomerEmail } from "@/lib/inbox/customer-email";

export async function ensureShopifyConversationSegment(
  db: AppDatabase,
  conversationId: string,
): Promise<void> {
  await db
    .insert(conversationSegments)
    .values({
      conversationId,
      segment: "shopify",
      updatedAt: new Date(),
    })
    .onConflictDoNothing();
}

export async function setShopifyLastOrderVisitorData(
  db: AppDatabase,
  conversationId: string,
  orderName: string,
  orderDetail?: string,
): Promise<void> {
  const name = orderName.trim();
  if (!name) return;

  const value = (orderDetail?.trim() || name).slice(0, 500);

  await db
    .insert(conversationVisitorData)
    .values({
      conversationId,
      dataKey: "shopify_last_order",
      dataValue: value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [conversationVisitorData.conversationId, conversationVisitorData.dataKey],
      set: {
        dataValue: value,
        updatedAt: new Date(),
      },
    });
}

export async function findConversationIdsByCustomerEmail(
  db: AppDatabase,
  workspaceId: string,
  email: string,
): Promise<string[]> {
  const normalized = normalizeCustomerEmail(email);
  if (!normalized) return [];

  const rows = await selectAll(
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.customerEmail, normalized),
        ),
      ),
  );

  return rows.map((row) => row.id);
}

export const SHOPIFY_VISITOR_DATA_KEYS = [
  "shopify_last_order",
  "shopify_location",
  "shopify_phone",
  "shopify_customer_id",
  "shopify_products",
  "shopify_total_spent",
  "shopify_order_count",
  "shopify_tags",
  "shopify_shop",
  "shopify_order_status",
  "shopify_store_name",
] as const;

export async function setShopifyProductsVisitorData(
  db: AppDatabase,
  conversationId: string,
  products: string,
): Promise<void> {
  await setShopifyVisitorDataKey(db, conversationId, "shopify_products", products);
}

export async function setShopifyVisitorDataKey(
  db: AppDatabase,
  conversationId: string,
  dataKey: string,
  dataValue: string,
): Promise<void> {
  const value = dataValue.trim().slice(0, 500);
  if (!value) return;

  await db
    .insert(conversationVisitorData)
    .values({
      conversationId,
      dataKey,
      dataValue: value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [conversationVisitorData.conversationId, conversationVisitorData.dataKey],
      set: {
        dataValue: value,
        updatedAt: new Date(),
      },
    });
}

export type ShopifyCustomerConversationPatch = {
  location?: string;
  phone?: string;
  customerId?: string;
  products?: string;
  totalSpent?: string;
  orderCount?: string;
  tags?: string;
  shop?: string;
  storeName?: string;
};

export async function applyShopifyCustomerToConversations(
  db: AppDatabase,
  workspaceId: string,
  email: string,
  patch: ShopifyCustomerConversationPatch = {},
): Promise<number> {
  const conversationIds = await findConversationIdsByCustomerEmail(db, workspaceId, email);
  if (conversationIds.length === 0) return 0;

  for (const conversationId of conversationIds) {
    await ensureShopifyConversationSegment(db, conversationId);
    if (patch.location?.trim()) {
      await setShopifyVisitorDataKey(db, conversationId, "shopify_location", patch.location);
    }
    if (patch.phone?.trim()) {
      await setShopifyVisitorDataKey(db, conversationId, "shopify_phone", patch.phone);
    }
    if (patch.customerId?.trim()) {
      await setShopifyVisitorDataKey(db, conversationId, "shopify_customer_id", patch.customerId);
    }
    if (patch.products?.trim()) {
      await setShopifyProductsVisitorData(db, conversationId, patch.products);
    }
    if (patch.totalSpent?.trim()) {
      await setShopifyVisitorDataKey(db, conversationId, "shopify_total_spent", patch.totalSpent);
    }
    if (patch.orderCount?.trim()) {
      await setShopifyVisitorDataKey(db, conversationId, "shopify_order_count", patch.orderCount);
    }
    if (patch.tags?.trim()) {
      await setShopifyVisitorDataKey(db, conversationId, "shopify_tags", patch.tags);
    }
    if (patch.shop?.trim()) {
      await setShopifyVisitorDataKey(db, conversationId, "shopify_shop", patch.shop);
    }
    if (patch.storeName?.trim()) {
      await setShopifyVisitorDataKey(db, conversationId, "shopify_store_name", patch.storeName);
    }
  }

  return conversationIds.length;
}

export type ShopifyOrderNoteKind = "create" | "update" | "cancelled" | "paid" | "refund" | "fulfilled";

export type ShopifyOrderConversationResult = {
  conversationsUpdated: number;
  notesCreated: number;
  noteEvents: Array<{ conversationId: string; messageId: string }>;
};

async function recentShopifyOrderNoteExists(
  db: AppDatabase,
  conversationId: string,
  text: string,
): Promise<boolean> {
  const rows = await selectAll(
    db
      .select({ text: messages.text })
      .from(messages)
      .where(and(eq(messages.conversationId, conversationId), eq(messages.from, "note")))
      .orderBy(desc(messages.sortOrder))
      .limit(8),
  );
  return rows.some((row) => row.text === text);
}

async function insertShopifyOrderNote(
  db: AppDatabase,
  conversationId: string,
  orderName: string,
  orderDetail: string | undefined,
  kind: ShopifyOrderNoteKind,
): Promise<string | null> {
  const label = (orderDetail?.trim() || orderName).slice(0, 400);
  const prefix =
    kind === "update"
      ? "📦 Shopify order updated:"
      : kind === "cancelled"
        ? "❌ Shopify order cancelled:"
        : kind === "paid"
          ? "💳 Shopify order paid:"
          : kind === "refund"
            ? "↩️ Shopify refund:"
            : kind === "fulfilled"
              ? "📬 Shopify order shipped:"
              : "🛒 New Shopify order:";
  const text = `${prefix} ${label}`;

  if (await recentShopifyOrderNoteExists(db, conversationId, text)) {
    return null;
  }

  const [maxOrderRow] = await db
    .select({ value: max(messages.sortOrder) })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  const now = new Date();
  const messageId = randomUUID();
  const sortOrder = (maxOrderRow?.value ?? -1) + 1;

  await db.insert(messages).values({
    id: messageId,
    conversationId,
    from: "note",
    text,
    timeLabel: formatMessageTime(now),
    sortOrder,
  });

  return messageId;
}

export async function applyShopifyOrderToConversations(
  db: AppDatabase,
  workspaceId: string,
  email: string,
  orderName: string,
  orderDetail?: string,
  options: {
    note?: ShopifyOrderNoteKind | false;
    products?: string;
    shop?: string;
    orderStatus?: string;
  } = {},
): Promise<ShopifyOrderConversationResult> {
  const noteKind = options.note === undefined ? "create" : options.note;
  const conversationIds = await findConversationIdsByCustomerEmail(db, workspaceId, email);
  if (conversationIds.length === 0) {
    return { conversationsUpdated: 0, notesCreated: 0, noteEvents: [] };
  }

  const noteEvents: Array<{ conversationId: string; messageId: string }> = [];

  for (const conversationId of conversationIds) {
    await ensureShopifyConversationSegment(db, conversationId);
    await setShopifyLastOrderVisitorData(db, conversationId, orderName, orderDetail);
    if (options.products?.trim()) {
      await setShopifyProductsVisitorData(db, conversationId, options.products);
    }
    if (options.shop?.trim()) {
      await setShopifyVisitorDataKey(db, conversationId, "shopify_shop", options.shop);
    }
    if (options.orderStatus?.trim()) {
      await setShopifyVisitorDataKey(db, conversationId, "shopify_order_status", options.orderStatus);
    }
    if (noteKind) {
      const messageId = await insertShopifyOrderNote(
        db,
        conversationId,
        orderName,
        orderDetail,
        noteKind,
      );
      if (messageId) noteEvents.push({ conversationId, messageId });
    }
  }

  return {
    conversationsUpdated: conversationIds.length,
    notesCreated: noteEvents.length,
    noteEvents,
  };
}

export async function loadShopifyOrderNoteMessages(db: AppDatabase, messageIds: string[]) {
  if (messageIds.length === 0) return [];

  const rows = await selectAll(
    db.select().from(messages).where(inArray(messages.id, messageIds)),
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  return messageIds
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => toApiMessage(row));
}
