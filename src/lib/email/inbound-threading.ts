import { randomUUID } from "crypto";
import { and, eq, inArray, max, sql } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { contacts, conversations, messages } from "@/db/schema";
import { pickVisitorGradient } from "@/lib/chatbox/visitor-session";
import {
  publishConversationUpdated,
  publishMessageCreated,
} from "@/lib/inbox/event-bus";
import { toApiMessage } from "@/lib/inbox/mappers";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { formatConversationTime, formatMessageTime, truncatePreview } from "@/lib/inbox/time";
import { createContact } from "@/lib/contacts/create";
import { normalizeCustomerEmail } from "@/lib/inbox/customer-email";

export function normalizeRfcMessageId(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith("<") ? trimmed : `<${trimmed}>`;
}

export async function emailMessageExists(
  db: AppDatabase,
  rfcMessageId?: string,
): Promise<boolean> {
  if (!rfcMessageId) return false;
  const row = await selectOne(
    db.select({ id: messages.id }).from(messages).where(eq(messages.rfcMessageId, rfcMessageId)),
  );
  return Boolean(row);
}

export async function findConversationIdByEmailThread(
  db: AppDatabase,
  workspaceId: string,
  customerEmail: string,
  refs: string[],
): Promise<string | undefined> {
  if (!refs.length) return undefined;

  const rows = await db
    .select({ conversationId: messages.conversationId })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.workspaceId, workspaceId),
        sql`lower(${conversations.customerEmail}) = lower(${customerEmail})`,
        inArray(messages.rfcMessageId, refs),
      ),
    )
    .limit(1);

  return rows[0]?.conversationId;
}

export async function upsertContactByEmail(
  db: AppDatabase,
  workspaceId: string,
  email: string,
  name: string,
) {
  const normalizedEmail = normalizeCustomerEmail(email) ?? "";
  const existing = await selectOne(
    db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, workspaceId),
          sql`lower(${contacts.email}) = lower(${normalizedEmail})`,
        ),
      ),
  );

  if (existing) {
    return existing;
  }

  const created = await createContact(db, workspaceId, {
    name: name.trim() || normalizedEmail,
    email: normalizedEmail,
    segments: ["chat"],
  });

  if (!created.ok) {
    return null;
  }

  return await selectOne(
    db.select().from(contacts).where(eq(contacts.id, created.contact.id)),
  );
}

export async function createConversationFromEmail(
  db: AppDatabase,
  workspaceId: string,
  input: {
    subject: string;
    customerEmail: string;
    customerName: string;
    body: string;
    rfcMessageId?: string;
    emailInReplyTo?: string;
  },
) {
  const conversationId = randomUUID();
  const now = new Date();
  const displayName = input.customerName.trim() || input.customerEmail;

  const [maxOrderRow] = await db
    .select({ value: max(conversations.sortOrder) })
    .from(conversations)
    .where(eq(conversations.workspaceId, workspaceId));

  await db.insert(conversations).values({
    id: conversationId,
    workspaceId,
    name: input.subject.trim() || displayName,
    initials: displayName.slice(0, 2).toUpperCase(),
    preview: truncatePreview(input.body),
    timeLabel: formatConversationTime(now),
    unread: 1,
    status: "pending",
    country: "US",
    avatarGradient: pickVisitorGradient(conversationId),
    sortOrder: (maxOrderRow?.value ?? -1) + 1,
    channel: "Email",
    customerEmail: normalizeCustomerEmail(input.customerEmail),
  });

  await addInboundEmailMessage(db, workspaceId, conversationId, {
    body: input.body,
    authorName: displayName,
    rfcMessageId: input.rfcMessageId,
    emailInReplyTo: input.emailInReplyTo,
  });

  return conversationId;
}

export async function addInboundEmailMessage(
  db: AppDatabase,
  workspaceId: string,
  conversationId: string,
  input: {
    body: string;
    authorName: string;
    rfcMessageId?: string;
    emailInReplyTo?: string;
  },
) {
  const conversation = await selectOne(
    db.select().from(conversations).where(eq(conversations.id, conversationId)),
  );
  if (!conversation || conversation.workspaceId !== workspaceId) {
    return null;
  }

  const [maxOrderRow] = await db
    .select({ value: max(messages.sortOrder) })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  const now = new Date();
  const messageId = randomUUID();
  const sortOrder = (maxOrderRow?.value ?? -1) + 1;
  const preview = truncatePreview(input.body);

  await db.insert(messages).values({
    id: messageId,
    conversationId,
    from: "visitor",
    text: input.body,
    timeLabel: formatMessageTime(now),
    sortOrder,
    deliveredAt: now,
    rfcMessageId: input.rfcMessageId ?? null,
    emailInReplyTo: input.emailInReplyTo ?? null,
  });

  await db
    .update(conversations)
    .set({
      preview,
      timeLabel: formatConversationTime(now),
      unread: conversation.unread + 1,
      status: conversation.status === "resolved" ? "pending" : conversation.status,
    })
    .where(eq(conversations.id, conversationId));

  const inserted = await selectOne(
    db.select().from(messages).where(eq(messages.id, messageId)),
  );
  if (inserted) {
    publishMessageCreated(workspaceId, conversationId, [toApiMessage(inserted, null, null)]);
    const conversationList = await fetchWorkspaceConversations(workspaceId);
    publishConversationUpdated(workspaceId, conversationList);
  }

  return messageId;
}

export type InboundEmailPayload = {
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
  rfcMessageId?: string;
  emailInReplyTo?: string;
  refs: string[];
  plusConversationId?: string | null;
};

export type InboundEmailResult =
  | { status: "duplicate" }
  | { status: "appended"; conversationId: string; messageId: string | null }
  | { status: "created"; conversationId: string };

export async function ingestInboundEmail(
  db: AppDatabase,
  workspaceId: string,
  payload: InboundEmailPayload,
): Promise<InboundEmailResult> {
  if (await emailMessageExists(db, payload.rfcMessageId)) {
    return { status: "duplicate" };
  }

  await upsertContactByEmail(db, workspaceId, payload.fromEmail, payload.fromName);

  let conversationId = await findConversationIdByEmailThread(
    db,
    workspaceId,
    payload.fromEmail,
    payload.refs,
  );

  if (!conversationId && payload.plusConversationId) {
    const plusConversation = await selectOne(
      db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, payload.plusConversationId),
            eq(conversations.workspaceId, workspaceId),
            sql`lower(${conversations.customerEmail}) = lower(${payload.fromEmail})`,
          ),
        ),
    );
    if (plusConversation) {
      conversationId = plusConversation.id;
    }
  }

  if (conversationId) {
    const messageId = await addInboundEmailMessage(db, workspaceId, conversationId, {
      body: payload.body,
      authorName: payload.fromName,
      rfcMessageId: payload.rfcMessageId,
      emailInReplyTo: payload.emailInReplyTo,
    });
    return { status: "appended", conversationId, messageId };
  }

  const createdId = await createConversationFromEmail(db, workspaceId, {
    subject: payload.subject,
    customerEmail: payload.fromEmail,
    customerName: payload.fromName,
    body: payload.body,
    rfcMessageId: payload.rfcMessageId,
    emailInReplyTo: payload.emailInReplyTo,
  });

  return { status: "created", conversationId: createdId };
}
