"use client";

import { useEffect, useRef, useState } from "react";
import type { ApiMessage } from "@/lib/inbox/mappers";
import { INBOX_EVENT_TYPE, type InboxStreamEvent } from "@/types/inbox-events";

type UseChatboxStreamOptions = {
  sessionId?: string | null;
  enabled?: boolean;
  onMessages?: (messages: ApiMessage[]) => void;
  onTyping?: (typing: boolean, operatorName?: string) => void;
  onReceipt?: (messageId: string, deliveredAt?: string | null, readAt?: string | null) => void;
};

export function useChatboxStream({
  sessionId = null,
  enabled = true,
  onMessages,
  onTyping,
  onReceipt,
}: UseChatboxStreamOptions) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef({ onMessages, onTyping, onReceipt });

  useEffect(() => {
    handlersRef.current = { onMessages, onTyping, onReceipt };
  }, [onMessages, onTyping, onReceipt]);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const source = new EventSource(`/api/chatbox/sessions/${sessionId}/stream`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as InboxStreamEvent;
        if (event.type === INBOX_EVENT_TYPE.CONNECTED) {
          setConnected(true);
          return;
        }
        if (event.type === INBOX_EVENT_TYPE.MESSAGES) {
          handlersRef.current.onMessages?.(event.messages);
          return;
        }
        if (event.type === INBOX_EVENT_TYPE.TYPING && event.from === "operator") {
          handlersRef.current.onTyping?.(event.typing, event.operatorName);
          return;
        }
        if (event.type === INBOX_EVENT_TYPE.RECEIPT) {
          handlersRef.current.onReceipt?.(event.messageId, event.deliveredAt, event.readAt);
        }
      } catch {
        // Ignore malformed events.
      }
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [enabled, sessionId]);

  return { connected: enabled && Boolean(sessionId) && connected };
}
