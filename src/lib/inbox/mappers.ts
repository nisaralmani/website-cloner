import type {
  Conversation,
  ConversationAssignee,
  ConversationStatus,
  CustomerDetails,
  Message,
  MessageAuthor,
} from "@/types/inbox";
import type { conversations, conversationReminders, messages, users } from "@/db/schema";
import { operatorDisplayName } from "@/lib/workspaces/operators";

type ConversationRow = typeof conversations.$inferSelect;
type MessageRow = typeof messages.$inferSelect;
type UserRow = typeof users.$inferSelect;

export type ApiMessage = Message & { sortOrder: number };

function toAssignee(user: UserRow | null | undefined): ConversationAssignee | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: operatorDisplayName(user),
    avatarGradient: user.avatarGradient,
  };
}

export function toConversation(
  row: ConversationRow,
  assignee?: ConversationAssignee | null,
  segments: string[] = [],
): Conversation {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials ?? undefined,
    preview: row.preview,
    time: row.timeLabel,
    unread: row.unread,
    status: row.status as ConversationStatus,
    country: row.country,
    avatarGradient: row.avatarGradient,
    channel: row.channel ?? undefined,
    assignee: assignee ?? null,
    segments,
  };
}

export function toConversationWithAssignee(
  row: ConversationRow,
  assigneeUser: UserRow | null | undefined,
  segments: string[] = [],
): Conversation {
  return toConversation(row, row.assignedOperatorId ? toAssignee(assigneeUser) : null, segments);
}

function toMessageAuthor(user: UserRow | null | undefined): MessageAuthor | null {
  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    name: operatorDisplayName(user),
    avatarGradient: user.avatarGradient,
  };
}

type ReminderRow = typeof conversationReminders.$inferSelect;

function toMessageAttachment(row: MessageRow) {
  if (!row.attachmentUrl || !row.attachmentName || !row.attachmentMime || row.attachmentSize == null) {
    return undefined;
  }

  return {
    url: row.attachmentUrl,
    name: row.attachmentName,
    mime: row.attachmentMime,
    size: row.attachmentSize,
  };
}

export function toMessage(
  row: MessageRow,
  authorUser?: UserRow | null,
  reminder?: ReminderRow | null,
): Message {
  const author =
    (row.from === "note" || row.from === "reminder") && row.authorUserId
      ? toMessageAuthor(authorUser)
      : null;

  return {
    id: row.id,
    from: row.from as Message["from"],
    text: row.text,
    time: row.timeLabel,
    author,
    remindAt:
      row.from === "reminder" && reminder?.remindAt
        ? reminder.remindAt.toISOString()
        : undefined,
    reminderId: row.from === "reminder" && reminder ? reminder.id : undefined,
    deliveredAt: row.deliveredAt?.toISOString(),
    readAt: row.readAt?.toISOString(),
    attachment: toMessageAttachment(row),
  };
}

export function toApiMessage(
  row: MessageRow,
  authorUser?: UserRow | null,
  reminder?: ReminderRow | null,
): ApiMessage {
  return {
    ...toMessage(row, authorUser, reminder),
    sortOrder: row.sortOrder,
  };
}

export function toCustomerDetails(row: ConversationRow): CustomerDetails {
  return {
    email: row.customerEmail ?? null,
    location: row.location ?? "Unknown",
    localTime: row.localTime ?? "—",
    timezone: row.timezone ?? "UTC",
    countryFlag: row.country,
    channel: row.channel ?? "Chat",
    device: row.device ?? "Unknown device",
    ip: row.ip ?? "•••.•••.•••.•••",
    visitorData: [],
    segments: [],
  };
}
