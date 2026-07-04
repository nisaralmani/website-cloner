import { getDb, selectAll } from "@/db/client";
import { getVisitorChatSession, touchVisitorChatSession } from "@/lib/chatbox/visitor-session";
import { filterWidgetMessages } from "@/lib/chatbox/widget-messages";
import { bindRequestContext, patchRequestContext } from "@/lib/logging/request-context";
import { subscribeConversationEvents } from "@/lib/inbox/event-bus";
import { toApiMessage } from "@/lib/inbox/mappers";
import { selectConversationMessagesAfter } from "@/lib/inbox/message-queries";
import { INBOX_THREAD_POLL_MS } from "@/lib/inbox/realtime";
import { INBOX_EVENT_TYPE, type InboxStreamEvent } from "@/types/inbox-events";

type RouteContext = { params: Promise<{ sessionId: string }> };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function encodeSse(event: InboxStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: Request, context: RouteContext) {
  bindRequestContext(request, { channel: "chatbox" });
  const { sessionId } = await context.params;
  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);

  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
  }

  const workspaceId = session.workspaceId;
  const conversationId = session.conversationId;
  patchRequestContext({ workspaceId, conversationId });
  let lastSortOrder = -1;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: InboxStreamEvent) => {
        if (closed) return;
        controller.enqueue(encoder.encode(encodeSse(event)));
      };

      const pollThread = async () => {
        try {
          const rows = await selectAll(
            selectConversationMessagesAfter(db, conversationId, lastSortOrder),
          );
          const incoming = rows
            .filter(({ message }) => message.from === "visitor" || message.from === "operator")
            .map(({ message, author, reminder }) => toApiMessage(message, author, reminder));

          if (incoming.length === 0) return;

          lastSortOrder = incoming[incoming.length - 1]!.sortOrder;
          send({
            type: INBOX_EVENT_TYPE.MESSAGES,
            conversationId,
            messages: incoming,
          });
        } catch {
          // Ignore transient poll errors.
        }
      };

      send({ type: INBOX_EVENT_TYPE.CONNECTED });
      void touchVisitorChatSession(db, sessionId);
      void pollThread();

      const threadTimer = setInterval(() => void pollThread(), INBOX_THREAD_POLL_MS);
      const heartbeat = setInterval(() => {
        if (closed) return;
        // Guard against enqueueing on a controller the runtime already tore
        // down (client gone before `abort` fired) — an uncaught throw here is
        // in a timer callback and would crash the process, not just this stream.
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          close();
        }
      }, 25_000);

      const unsubscribe = subscribeConversationEvents(workspaceId, (event) => {
        if (event.type === INBOX_EVENT_TYPE.TYPING) {
          if (event.conversationId !== conversationId || event.from !== "operator") {
            return;
          }
          send(event);
          return;
        }

        if (event.type === INBOX_EVENT_TYPE.RECEIPT) {
          if (event.conversationId !== conversationId) {
            return;
          }
          send(event);
          return;
        }

        if (event.type !== INBOX_EVENT_TYPE.MESSAGES || event.conversationId !== conversationId) {
          return;
        }

        const visible = filterWidgetMessages(event.messages);
        if (visible.length === 0) return;

        const last = visible.at(-1);
        if (last) {
          lastSortOrder = Math.max(lastSortOrder, last.sortOrder);
        }

        send({
          type: INBOX_EVENT_TYPE.MESSAGES,
          conversationId,
          messages: visible,
        });
      });

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(threadTimer);
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
