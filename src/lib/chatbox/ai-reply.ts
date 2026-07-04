/**
 * Chat widget AI auto-reply (ported from Ai Helpdesk ai.ts chatReply).
 * Uses OpenAI when OPENAI_API_KEY is set; otherwise returns template replies.
 */
import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";
import { sanitizePromptField } from "@/lib/security/prompt-sanitizer";
import type { ShopifyCustomerSummary } from "@/types/shopify";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export function isChatAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function templateChatReply(question: string): string {
  const normalized = question.toLowerCase();
  if (/track|where|ship|deliver|order status/.test(normalized)) {
    return 'I can help track your order. Share your order number and email, or tap "Talk to a human" for a teammate.';
  }
  if (/return|refund|exchange|cancel/.test(normalized)) {
    return 'We offer free returns and replacements within 30 days. Tap "Talk to a human" and a teammate will help right away.';
  }
  return 'Thanks for your message! I can help with orders, shipping, returns, and product questions. Share a bit more detail, or tap "Talk to a human" anytime.';
}

function formatShopifyCustomerContext(customer: ShopifyCustomerSummary | null | undefined): string {
  if (!customer) {
    return "The shopper has not been identified yet.";
  }
  // Customer-controlled Shopify fields are neutralized before entering the
  // prompt (prompt-injection defense); legitimate names/emails are unchanged.
  const displayName = sanitizePromptField(customer.displayName);
  const email = sanitizePromptField(customer.email);
  const orders = customer.orders ?? [];
  if (!orders.length) {
    return `The shopper is identified as ${displayName} (${email}). No orders are on file for this email.`;
  }
  const orderLines = orders
    .map((order) => {
      const status =
        [sanitizePromptField(order.financialStatus), sanitizePromptField(order.fulfillmentStatus)]
          .filter(Boolean)
          .join(" / ") || "unknown";
      return `• ${sanitizePromptField(order.name)} — ${status}`;
    })
    .join("\n");
  return (
    `The shopper is ALREADY identified: ${displayName} (${email}). ` +
    `Their orders are already synced from Shopify — use these directly and do NOT ask for an order number or email again:\n` +
    `${orderLines}\n` +
    `When they ask about shipping/delivery, answer from these orders by name.`
  );
}

export async function generateChatAiReply(args: {
  history: ChatTurn[];
  customerName?: string | null;
  customerEmail?: string | null;
  shopifyCustomer?: ShopifyCustomerSummary | null;
  storePolicy: string;
}): Promise<{ text: string; source: "openai" | "template" }> {
  const lastInbound =
    [...args.history].reverse().find((entry) => entry.role === "user")?.content ?? "";

  if (!isChatAiConfigured()) {
    return { text: templateChatReply(lastInbound), source: "template" };
  }

  const customerContext = args.shopifyCustomer
    ? formatShopifyCustomerContext(args.shopifyCustomer)
    : args.customerEmail
      ? `The shopper is identified as ${sanitizePromptField(args.customerName) || "Customer"} (${sanitizePromptField(args.customerEmail)}).`
      : "The shopper has not been identified yet.";

  try {
    const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      timeout: 8000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              "You are the live-chat assistant on a store website. Keep replies to 2-4 sentences. " +
              `${args.storePolicy} Never invent order numbers or tracking. ` +
              `Only ask for an order number/email if the shopper is NOT identified or has no orders on file. ` +
              `If their orders are already listed below, use those directly. ` +
              `If you cannot resolve the request, suggest talking to a human. ` +
              `${customerContext}`,
          },
          ...args.history.map((entry) => ({ role: entry.role, content: entry.content })),
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (text) {
      return { text, source: "openai" };
    }
  } catch {
    // fall through
  }

  return { text: templateChatReply(lastInbound), source: "template" };
}

function wrapEmail(opts: {
  firstName: string;
  body: string;
  agentName: string;
  storeName: string;
  website?: string;
}): string {
  const greeting = `Hi ${opts.firstName || "there"},`;
  const signOff = ["Best regards,", opts.agentName, `${opts.storeName} Customer Support`, opts.website || ""]
    .filter(Boolean)
    .join("\n");
  return `${greeting}\n\n${opts.body.trim()}\n\n${signOff}`;
}

function templateEmailBody(storeName: string): string {
  return (
    `Thank you for reaching out to ${storeName}. We have received your message and our team is ` +
    `looking into it. We will get back to you with an update as soon as possible.`
  );
}

export async function generateEmailAiReply(args: {
  history: ChatTurn[];
  customerName?: string | null;
  customerEmail?: string | null;
  agentName: string;
  storeName: string;
  website?: string;
  storePolicy: string;
}): Promise<{ text: string; source: "openai" | "template" }> {
  const lastInbound =
    [...args.history].reverse().find((entry) => entry.role === "user")?.content ?? "";
  const firstName = (args.customerName || "").trim().split(/\s+/)[0] || "";
  const wrap = (body: string) =>
    wrapEmail({
      firstName,
      body,
      agentName: args.agentName,
      storeName: args.storeName,
      website: args.website,
    });

  if (!isChatAiConfigured()) {
    return { text: wrap(templateEmailBody(args.storeName)), source: "template" };
  }

  const customerContext = args.customerEmail
    ? `Customer: ${sanitizePromptField(args.customerName) || "Customer"} (${sanitizePromptField(args.customerEmail)}).`
    : "Customer details are not on file.";
  // Merchant-configurable identity fields are also neutralized before entering
  // the system prompt.
  const safeAgentName = sanitizePromptField(args.agentName) || "Support";
  const safeStoreName = sanitizePromptField(args.storeName) || "Support";

  try {
    const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      timeout: 9000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              `You are ${safeAgentName}, a customer support agent for ${safeStoreName}. ` +
              "Write ONLY the body paragraphs — no greeting or sign-off. " +
              `${args.storePolicy} ${customerContext}`,
          },
          ...args.history.map((entry) => ({ role: entry.role, content: entry.content })),
        ],
      }),
    });
    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const body = data.choices?.[0]?.message?.content?.trim();
    if (body) return { text: wrap(body), source: "openai" };
  } catch {
    // fall through
  }

  return { text: wrap(templateEmailBody(args.storeName)), source: "template" };
}

export async function summarizeConversation(history: ChatTurn[]): Promise<string> {
  const transcript = history
    .map((entry) => `${entry.role === "user" ? "Customer" : "Assistant"}: ${entry.content}`)
    .join("\n");

  if (!isChatAiConfigured()) {
    const firstQuestion = history.find((entry) => entry.role === "user")?.content ?? "";
    return `Customer asked: "${firstQuestion.slice(0, 200)}". They requested a human agent.`;
  }

  try {
    const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      timeout: 8000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Summarize this support chat for the agent taking over. 1-2 sentences: issue and what was tried.",
          },
          { role: "user", content: transcript },
        ],
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const summary = data.choices?.[0]?.message?.content?.trim();
      if (summary) return summary;
    }
  } catch {
    // fall through
  }

  const firstQuestion = history.find((entry) => entry.role === "user")?.content ?? "";
  return `Customer asked: "${firstQuestion.slice(0, 200)}". They requested a human agent.`;
}
