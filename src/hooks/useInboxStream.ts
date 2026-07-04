"use client";

import { useEffect, useRef, useState } from "react";
import type { ApiMessage } from "@/lib/inbox/mappers";
import type { Conversation } from "@/types/inbox";
import { INBOX_EVENT_TYPE, type InboxStreamEvent } from "@/types/inbox-events";

type UseInboxStreamOptions = {
  enabled?: boolean;
  conversationId?: string | null;
  includeSnoozed?: boolean;
  onConversations?: (conversations: Conversation[]) => void;
  onMessages?: (conversationId: string, messages: ApiMessage[]) => void;
  onTyping?: (
    conversationId: string,
    from: "visitor" | "operator",
    typing: boolean,
    operatorName?: string,
  ) => void;
  onReceipt?: (
    conversationId: string,
    messageId: string,
    deliveredAt?: string | null,
    readAt?: string | null,
  ) => void;
};

export function useInboxStream({
  enabled = true,
  conversationId = null,
  includeSnoozed = false,
  onConversations,
  onMessages,
  onTyping,
  onReceipt,
}: UseInboxStreamOptions) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef({ onConversations, onMessages, onTyping, onReceipt });

  useEffect(() => {
    handlersRef.current = { onConversations, onMessages, onTyping, onReceipt };
  }, [onConversations, onMessages, onTyping, onReceipt]);

  useEffect(() => {
    if (!enabled) return;

    const params = new URLSearchParams();
    if (conversationId) {
      params.set("conversation", conversationId);
    }
    if (includeSnoozed) {
      params.set("includeSnoozed", "1");
    }
    const query = params.toString();
    const source = new EventSource(query ? `/api/inbox/stream?${query}` : "/api/inbox/stream");

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as InboxStreamEvent;
        if (event.type === INBOX_EVENT_TYPE.CONNECTED) {
          setConnected(true);
          return;
        }
        if (event.type === INBOX_EVENT_TYPE.CONVERSATIONS) {
          handlersRef.current.onConversations?.(event.conversations);
          return;
        }
        if (event.type === INBOX_EVENT_TYPE.MESSAGES) {
          handlersRef.current.onMessages?.(event.conversationId, event.messages);
          return;
        }
        if (event.type === INBOX_EVENT_TYPE.TYPING) {
          handlersRef.current.onTyping?.(
            event.conversationId,
            event.from,
            event.typing,
            event.operatorName,
          );
          return;
        }
        if (event.type === INBOX_EVENT_TYPE.RECEIPT) {
          handlersRef.current.onReceipt?.(
            event.conversationId,
            event.messageId,
            event.deliveredAt,
            event.readAt,
          );
        }
      } catch {
        // Ignore malformed events.
      }
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [conversationId, enabled, includeSnoozed]);

  return { connected: enabled && connected };
}
