import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { conversations } from "@/db/schema";
import { getChatboxMaxAttachmentBytes } from "@/lib/chatbox/attachment-preferences";
import { saveChatboxAttachment } from "@/lib/chatbox/message-attachment";
import { requireSession } from "@/lib/auth/request";
import { autoAssignOperatorOnReply } from "@/lib/inbox/routing-preferences";
import { rerunRoutingIfAssignedOperatorOffline } from "@/lib/routing-rules/rerun-offline";
import { insertConversationMessage } from "@/lib/inbox/conversation-messages";
import { toApiMessage } from "@/lib/inbox/mappers";
import { selectConversationMessagesAfter } from "@/lib/inbox/message-queries";
import {
  publishConversationUpdated,
  publishMessageCreated,
} from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { publishConversationTyping } from "@/lib/inbox/typing";
import { markVisitorMessagesRead } from "@/lib/inbox/message-receipts";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";

type RouteContext = { params: Promise<{ id: string }> };

async function getConversationForWorkspace(id: string, workspaceId: string) {
  const db = await getDb();
  return selectOne(
    db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.workspaceId, workspaceId))),
  );
}

async function publishOperatorMessage(
  workspaceId: string,
  conversationId: string,
  apiMessage: NonNullable<Awaited<ReturnType<typeof insertConversationMessage>>>,
) {
  publishMessageCreated(workspaceId, conversationId, [apiMessage]);
  const conversationList = await fetchWorkspaceConversations(workspaceId);
  publishConversationUpdated(workspaceId, conversationList);

  const db = await getDb();
  await deliverWorkspaceWebhooks(db, workspaceId, "message:operator", {
    conversationId,
    message: apiMessage,
  });
}

export async function GET(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const conversation = await getConversationForWorkspace(id, session.workspace.id);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const afterParam = new URL(request.url).searchParams.get("after");
  const after = afterParam === null ? -1 : Number.parseInt(afterParam, 10);
  if (!Number.isFinite(after)) {
    return NextResponse.json({ error: "Invalid after parameter" }, { status: 400 });
  }

  const db = await getDb();
  const messageRows = await selectAll(selectConversationMessagesAfter(db, id, after));

  return NextResponse.json({
    messages: messageRows.map(({ message, author, reminder }) =>
      toApiMessage(message, author, reminder),
    ),
    lastSortOrder:
      messageRows.length > 0
        ? messageRows[messageRows.length - 1]!.message.sortOrder
        : after,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const workspaceId = session.workspace.id;

  const conversation = await getConversationForWorkspace(id, workspaceId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let text = "";
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const textField = formData.get("text");
    text = typeof textField === "string" ? textField.trim() : "";

    const fileField = formData.get("file");
    file = fileField instanceof File && fileField.size > 0 ? fileField : null;
  } else {
    let body: { text?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    text = body.text?.trim() ?? "";
  }

  if (!text && !file) {
    return NextResponse.json({ error: "Message text or file is required" }, { status: 400 });
  }

  const db = await getDb();
  let attachment = null;
  let messageId: string | undefined;

  if (file) {
    const maxBytes = await getChatboxMaxAttachmentBytes(db, workspaceId);
    const saved = await saveChatboxAttachment(workspaceId, file, maxBytes);
    if ("error" in saved) {
      return NextResponse.json({ error: saved.error }, { status: 400 });
    }
    messageId = saved.messageId;
    attachment = {
      url: saved.url,
      name: saved.name,
      mime: saved.mime,
      size: saved.size,
    };
  }

  const displayText = text || (attachment ? `📎 ${attachment.name}` : "");

  const apiMessage = await insertConversationMessage(db, id, "operator", displayText, {
    messageId,
    attachment: attachment ?? undefined,
  });

  if (!apiMessage) {
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }

  await autoAssignOperatorOnReply(db, workspaceId, id, session.user.id);
  await rerunRoutingIfAssignedOperatorOffline(db, workspaceId, id);
  publishConversationTyping(workspaceId, id, "operator", false);
  await markVisitorMessagesRead(db, workspaceId, id);
  await publishOperatorMessage(workspaceId, id, apiMessage);

  return NextResponse.json({ message: apiMessage });
}
