import type { ApiMessage } from "@/lib/inbox/mappers";
import type { Conversation } from "@/types/inbox";

export const INBOX_EVENT_TYPE = {
  CONNECTED: "connected",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
  TYPING: "typing",
  RECEIPT: "receipt",
} as const;

export type InboxEventType = (typeof INBOX_EVENT_TYPE)[keyof typeof INBOX_EVENT_TYPE];

export type InboxStreamEvent =
  | { type: typeof INBOX_EVENT_TYPE.CONNECTED }
  | { type: typeof INBOX_EVENT_TYPE.CONVERSATIONS; conversations: Conversation[] }
  | {
      type: typeof INBOX_EVENT_TYPE.MESSAGES;
      conversationId: string;
      messages: ApiMessage[];
    }
  | {
      type: typeof INBOX_EVENT_TYPE.TYPING;
      conversationId: string;
      from: "visitor" | "operator";
      typing: boolean;
      operatorName?: string;
    }
  | {
      type: typeof INBOX_EVENT_TYPE.RECEIPT;
      conversationId: string;
      messageId: string;
      deliveredAt?: string | null;
      readAt?: string | null;
    };
