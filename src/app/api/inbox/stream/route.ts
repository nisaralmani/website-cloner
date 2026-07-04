import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { bindSessionRequestContext } from "@/lib/logging/session-context";
import { patchRequestContext } from "@/lib/logging/request-context";
import { subscribeConversationEvents } from "@/lib/inbox/event-bus";
import { processDueRemindersAndPublish } from "@/lib/inbox/process-due-reminders";
import {
  fetchConversationMessagesAfter,
  fetchWorkspaceConversations,
} from "@/lib/inbox/snapshot";
import {
  INBOX_LIST_POLL_MS,
  INBOX_THREAD_POLL_MS,
} from "@/lib/inbox/realtime";
import { INBOX_EVENT_TYPE, type InboxStreamEvent } from "@/types/inbox-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function encodeSse(event: InboxStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: Request) {
  const session = await bindSessionRequestContext(request);
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = session.workspace.id;
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversation")?.trim() || null;
  if (conversationId) patchRequestContext({ conversationId, channel: "inbox" });
  const includeSnoozed = url.searchParams.get("includeSnoozed") === "1";

  let listSnapshot = "";
  let lastSortOrder = -1;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: InboxStreamEvent) => {
        if (closed) return;
        controller.enqueue(encoder.encode(encodeSse(event)));
      };

      const pollList = async () => {
        try {
          const db = await getDb();
          await processDueRemindersAndPublish(db, workspaceId);
          const conversations = await fetchWorkspaceConversations(workspaceId, {
            includeSnoozed,
          });
          const nextSnapshot = JSON.stringify(conversations);
          if (nextSnapshot !== listSnapshot) {
            listSnapshot = nextSnapshot;
            send({ type: INBOX_EVENT_TYPE.CONVERSATIONS, conversations });
          }
        } catch {
          // Ignore transient poll errors.
        }
      };

      const pollThread = async () => {
        if (!conversationId) return;
        try {
          const incoming = await fetchConversationMessagesAfter(
            workspaceId,
            conversationId,
            lastSortOrder,
          );
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
      void pollList();
      void pollThread();

      const listTimer = setInterval(() => void pollList(), INBOX_LIST_POLL_MS);
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
        if (event.type === INBOX_EVENT_TYPE.TYPING && conversationId && event.conversationId !== conversationId) {
          return;
        }
        if (event.type === INBOX_EVENT_TYPE.RECEIPT && conversationId && event.conversationId !== conversationId) {
          return;
        }
        if (event.type === INBOX_EVENT_TYPE.CONVERSATIONS) {
          listSnapshot = JSON.stringify(event.conversations);
        }
        if (event.type === INBOX_EVENT_TYPE.MESSAGES && event.conversationId === conversationId) {
          const last = event.messages.at(-1);
          if (last) lastSortOrder = Math.max(lastSortOrder, last.sortOrder);
        }
        send(event);
      });

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(listTimer);
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
