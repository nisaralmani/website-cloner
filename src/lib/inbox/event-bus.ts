import {
  getRedisStatus,
  isRedisEnabled,
  publishRedisMessage,
  subscribeRedisPattern,
} from "@/lib/infra/redis-client";
import { getRequestId, runWithRequestContext } from "@/lib/logging/request-context";
import { createComponentLogger } from "@/lib/logging/logger";
import type { ApiMessage } from "@/lib/inbox/mappers";
import type { Conversation } from "@/types/inbox";
import {
  INBOX_EVENT_TYPE,
  type InboxStreamEvent,
} from "@/types/inbox-events";

type Listener = (event: InboxStreamEvent) => void;

const CHANNEL_PREFIX = "bybelt:inbox:";

const log = createComponentLogger("inbox:event-bus");

const globalStore = globalThis as typeof globalThis & {
  __inboxEventBuses?: Map<string, Set<Listener>>;
  __inboxRedisOrigin?: string;
  __inboxRedisPatternUnsubscribe?: () => void;
  __inboxRedisPatternSubscribed?: boolean;
};

function getBuses() {
  if (!globalStore.__inboxEventBuses) {
    globalStore.__inboxEventBuses = new Map();
  }
  return globalStore.__inboxEventBuses;
}

export function isRedisInboxBusEnabled() {
  return isRedisEnabled();
}

export function getInboxBusTransportStatus() {
  if (!isRedisInboxBusEnabled()) {
    return "disabled" as const;
  }
  return getRedisStatus();
}

function dispatchLocal(workspaceId: string, event: InboxStreamEvent) {
  const listeners = getBuses().get(workspaceId);
  if (!listeners) return;
  // Isolate each subscriber: a throwing listener (e.g. an SSE stream whose
  // controller was torn down before its abort handler ran, making
  // `controller.enqueue` throw) must not stop fan-out to the remaining
  // subscribers, nor propagate into the publisher's request path — publishers
  // call this synchronously after a successful write (see event-bus callers),
  // so an escaping throw would 500 a request whose effect already committed.
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      log.warn("inbox_listener_dispatch_failed", {
        workspaceId,
        eventType: event.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function getInstanceOrigin() {
  if (!globalStore.__inboxRedisOrigin) {
    globalStore.__inboxRedisOrigin = crypto.randomUUID();
  }
  return globalStore.__inboxRedisOrigin;
}

function ensureRedisSubscriber() {
  if (!isRedisInboxBusEnabled()) return;
  if (globalStore.__inboxRedisPatternSubscribed) return;

  const origin = getInstanceOrigin();
  globalStore.__inboxRedisPatternUnsubscribe = subscribeRedisPattern(
    `${CHANNEL_PREFIX}*`,
    (channel, message) => {
      if (!channel.startsWith(CHANNEL_PREFIX)) return;

      const workspaceId = channel.slice(CHANNEL_PREFIX.length);
      if (!workspaceId) return;

      try {
        const envelope = JSON.parse(message) as {
          origin?: string;
          requestId?: string;
          event?: InboxStreamEvent;
        };
        if (!envelope.event || envelope.origin === origin) return;
        const dispatch = () => dispatchLocal(workspaceId, envelope.event!);
        if (envelope.requestId) {
          runWithRequestContext(
            { requestId: envelope.requestId, workspaceId },
            dispatch,
          );
        } else {
          dispatch();
        }
      } catch {
        // Ignore malformed pub/sub payloads.
      }
    },
  );
  globalStore.__inboxRedisPatternSubscribed = true;
}

async function publishRedis(workspaceId: string, event: InboxStreamEvent) {
  const requestId = getRequestId();
  await publishRedisMessage(
    `${CHANNEL_PREFIX}${workspaceId}`,
    JSON.stringify({
      origin: getInstanceOrigin(),
      ...(requestId ? { requestId } : {}),
      event,
    }),
  );
}

export function subscribeInbox(workspaceId: string, listener: Listener) {
  const buses = getBuses();
  if (!buses.has(workspaceId)) {
    buses.set(workspaceId, new Set());
  }
  buses.get(workspaceId)!.add(listener);

  ensureRedisSubscriber();

  return () => {
    buses.get(workspaceId)?.delete(listener);
  };
}

export function publishInbox(workspaceId: string, event: InboxStreamEvent) {
  dispatchLocal(workspaceId, event);
  // Fire-and-forget by design (single-instance fan-out still works via
  // dispatchLocal above). A Redis outage/timeout must degrade to
  // single-instance delivery, not crash the process — without this .catch(),
  // a rejected publishRedis() is an unhandled promise rejection, which is
  // fatal by default in Node 15+ and would take down every tenant.
  publishRedis(workspaceId, event).catch((error) => {
    log.warn("inbox_redis_publish_failed", {
      workspaceId,
      eventType: event.type,
      error: error instanceof Error ? error.message : String(error),
    });
  });
}

export function publishConversationCreated(workspaceId: string, conversations: Conversation[]) {
  publishInbox(workspaceId, { type: INBOX_EVENT_TYPE.CONVERSATIONS, conversations });
}

export function publishConversationUpdated(workspaceId: string, conversations: Conversation[]) {
  publishInbox(workspaceId, { type: INBOX_EVENT_TYPE.CONVERSATIONS, conversations });
}

export function publishConversationDeleted(workspaceId: string, conversations: Conversation[]) {
  publishInbox(workspaceId, { type: INBOX_EVENT_TYPE.CONVERSATIONS, conversations });
}

export function publishMessageCreated(
  workspaceId: string,
  conversationId: string,
  messages: ApiMessage[],
) {
  publishInbox(workspaceId, {
    type: INBOX_EVENT_TYPE.MESSAGES,
    conversationId,
    messages,
  });
}

export function publishMessageUpdated(
  workspaceId: string,
  conversationId: string,
  messages: ApiMessage[],
) {
  publishInbox(workspaceId, {
    type: INBOX_EVENT_TYPE.MESSAGES,
    conversationId,
    messages,
  });
}

export function publishReviewUpdated(
  workspaceId: string,
  conversationId: string,
  messages: ApiMessage[],
) {
  publishMessageUpdated(workspaceId, conversationId, messages);
}

export function publishContactUpdated(workspaceId: string, conversations: Conversation[]) {
  publishConversationUpdated(workspaceId, conversations);
}

export function publishTypingUpdated(
  workspaceId: string,
  conversationId: string,
  from: "visitor" | "operator",
  typing: boolean,
  operatorName?: string,
) {
  publishInbox(workspaceId, {
    type: INBOX_EVENT_TYPE.TYPING,
    conversationId,
    from,
    typing,
    operatorName,
  });
}

export function publishMessageReceiptUpdated(
  workspaceId: string,
  conversationId: string,
  messageId: string,
  deliveredAt?: string | null,
  readAt?: string | null,
) {
  publishInbox(workspaceId, {
    type: INBOX_EVENT_TYPE.RECEIPT,
    conversationId,
    messageId,
    deliveredAt,
    readAt,
  });
}

export function subscribeConversationEvents(workspaceId: string, listener: Listener) {
  return subscribeInbox(workspaceId, listener);
}

export function unsubscribeConversationEvents(unsubscribe: () => void) {
  unsubscribe();
}
