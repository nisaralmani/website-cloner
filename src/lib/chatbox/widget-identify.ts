import type { AppDatabase } from "@/db/client";
import { enrichContactFromShopify } from "@/lib/integrations/shopify-contact-enrich";
import { resolveOrderContext } from "@/lib/integrations/order-context-resolver";
import { insertInternalSystemNote } from "@/lib/chatbox/widget-thread";
import { updateVisitorSessionIdentity } from "@/lib/chatbox/visitor-identity-preferences";
import type { visitorChatSessions } from "@/db/schema";
import { isValidEmail } from "@/lib/chatbox/widget-escalation";
import { normalizeCustomerEmail } from "@/lib/inbox/customer-email";

type VisitorChatSessionRow = typeof visitorChatSessions.$inferSelect;

export type WidgetIdentifyResult = {
  ok: boolean;
  valid?: boolean;
  name: string;
  email: string;
  ordersCount: number;
  orders: { number: string; status: string; placedAt: string | null }[];
  live: boolean;
};

export async function performWidgetIdentify(
  db: AppDatabase,
  session: VisitorChatSessionRow,
  input: { name?: string; email: string },
): Promise<WidgetIdentifyResult> {
  const cleanEmail = normalizeCustomerEmail(input.email) ?? "";
  if (!isValidEmail(cleanEmail)) {
    return {
      ok: false,
      valid: false,
      name: input.name?.trim() || "",
      email: cleanEmail,
      ordersCount: 0,
      orders: [],
      live: false,
    };
  }

  const name = input.name?.trim() || "";
  await updateVisitorSessionIdentity(db, session.id, session.conversationId, {
    email: cleanEmail,
    phone: undefined,
  });

  let ordersCount = 0;
  let orders: WidgetIdentifyResult["orders"] = [];
  let live = false;

  try {
    const enriched = await enrichContactFromShopify(db, session.workspaceId, cleanEmail, {
      conversationId: session.conversationId,
    });
    live = enriched.linked;
    const { live: liveContext } = await resolveOrderContext({
      workspaceId: session.workspaceId,
      email: cleanEmail,
    });
    if (liveContext?.customer) {
      const customer = liveContext.customer;
      ordersCount = customer.orderCount;
      orders = customer.orders.map((order) => ({
        number: order.name,
        status: [order.financialStatus, order.fulfillmentStatus].filter(Boolean).join(" / ") || "unknown",
        placedAt: order.processedAt,
      }));
    }
  } catch {
    // Non-fatal — identification still succeeds without Shopify data.
  }

  await insertInternalSystemNote(
    db,
    session.workspaceId,
    session.conversationId,
    `Customer identified: ${name || "—"} <${cleanEmail}>${orders.length ? ` · ${orders.length} order(s) synced` : ""}.`,
  );

  return {
    ok: true,
    name,
    email: cleanEmail,
    ordersCount,
    orders,
    live,
  };
}
