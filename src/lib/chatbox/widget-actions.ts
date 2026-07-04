import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { conversations, conversationSegments } from "@/db/schema";
import { getWorkspaceAgentConfig } from "@/lib/email/agent-config";
import { fetchShopifyWorkspaceStatus } from "@/lib/integrations/shopify-context";
import { resolveOrderContext } from "@/lib/integrations/order-context-resolver";
import { ingestVisitorMessage } from "@/lib/inbox/visitor-ingest";
import { selectAll } from "@/db/client";
import { selectConversationMessages } from "@/lib/inbox/message-queries";
import { summarizeConversation, type ChatTurn } from "@/lib/chatbox/ai-reply";
import {
  insertInternalSystemNote,
  insertWidgetOperatorMessage,
} from "@/lib/chatbox/widget-thread";
import { updateVisitorSessionIdentity } from "@/lib/chatbox/visitor-identity-preferences";
import { visitorChatSessions } from "@/db/schema";
import { normalizeCustomerEmail } from "@/lib/inbox/customer-email";

type VisitorChatSessionRow = typeof visitorChatSessions.$inferSelect;

export async function performOrderLookup(
  db: AppDatabase,
  session: VisitorChatSessionRow,
  orderNumber: string,
  email: string,
) {
  const wantedRaw = orderNumber.trim();
  const wanted = wantedRaw.replace(/^#/, "").toLowerCase();
  const cleanEmail = normalizeCustomerEmail(email) ?? "";

  await updateVisitorSessionIdentity(db, session.id, session.conversationId, { email: cleanEmail });
  await ingestVisitorMessage(db, session.workspaceId, session.conversationId, `Order lookup: ${wantedRaw} (${cleanEmail})`);

  const shopifyStatus = await fetchShopifyWorkspaceStatus(session.workspaceId);
  if (!shopifyStatus?.linked) {
    const note =
      'Order lookup is not connected to the store yet. Tap "Talk to a human" if it is urgent.';
    await insertWidgetOperatorMessage(db, session.workspaceId, session.conversationId, note);
    return { found: false, result: note, configured: false };
  }

  let result: string;
  let found = false;
  try {
    const { live } = await resolveOrderContext({
      workspaceId: session.workspaceId,
      email: cleanEmail,
    });
    const customer = live?.customer ?? null;
    const order = customer?.orders.find(
      (entry) => entry.name.replace(/^#/, "").toLowerCase() === wanted,
    );
    if (order) {
      found = true;
      const placed = order.processedAt
        ? new Date(order.processedAt).toLocaleDateString()
        : "unknown date";
      const items = order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
      result =
        `Order ${order.name} — status: ${[order.financialStatus, order.fulfillmentStatus].filter(Boolean).join(" / ") || "unknown"}. ` +
        `Placed ${placed}, ${items} item(s), total ${order.total?.currencyCode || "USD"} ${order.total?.amount || "0"}.`;
    } else if (customer) {
      result = `I found your account but no order matching "${wantedRaw}". Please double-check the order number or tap "Talk to a human".`;
    } else {
      result = `I couldn't find an account for ${cleanEmail}. Check the email used at checkout, or tap "Talk to a human".`;
    }
  } catch {
    result =
      'I ran into a problem reaching the store. Try again shortly, or tap "Talk to a human".';
  }

  await insertWidgetOperatorMessage(db, session.workspaceId, session.conversationId, result);
  return { found, result, configured: true };
}

export async function performHandoff(
  db: AppDatabase,
  session: VisitorChatSessionRow,
  input: { email?: string; name?: string },
) {
  if (input.email?.trim() || input.name?.trim()) {
    await updateVisitorSessionIdentity(db, session.id, session.conversationId, {
      email: input.email,
      phone: undefined,
    });
  }

  await db
    .insert(conversationSegments)
    .values({ conversationId: session.conversationId, segment: "needs-human", updatedAt: new Date() })
    .onConflictDoNothing();

  await db
    .update(conversations)
    .set({ status: "pending", unread: 1 })
    .where(eq(conversations.id, session.conversationId));

  const rows = await selectAll(selectConversationMessages(db, session.conversationId));
  const turns: ChatTurn[] = rows
    .filter(({ message }) => message.from === "visitor" || message.from === "operator")
    .map(({ message }) => ({
      role: message.from === "visitor" ? ("user" as const) : ("assistant" as const),
      content: message.text,
    }));

  if (turns.length) {
    const summary = await summarizeConversation(turns);
    await insertInternalSystemNote(
      db,
      session.workspaceId,
      session.conversationId,
      `AI summary for agent: ${summary}`,
    );
  }

  const cfg = await getWorkspaceAgentConfig(db, session.workspaceId);
  const note =
    cfg.transfer.onlineMessage ||
    "A teammate will join this chat shortly.";
  await insertWidgetOperatorMessage(db, session.workspaceId, session.conversationId, note);

  return { ok: true as const };
}
