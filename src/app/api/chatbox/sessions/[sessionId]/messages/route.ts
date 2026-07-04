import { NextResponse } from "next/server";
import { getDb, selectAll } from "@/db/client";
import { uploadChatboxAttachment } from "@/lib/chatbox/upload-attachment";
import {
  assertVisitorCanSendMessage,
  updateVisitorSessionIdentity,
} from "@/lib/chatbox/visitor-identity-preferences";
import {
  getVisitorChatSession,
  isVisitorBlocked,
  touchVisitorChatSession,
} from "@/lib/chatbox/visitor-session";
import { maybeSendChatAiReply } from "@/lib/chatbox/ai-auto-reply";
import { conversationNeedsHuman } from "@/lib/chatbox/human-handoff-state";
import {
  extractOrderNumber,
  WIDGET_ESCALATE_RE,
} from "@/lib/chatbox/widget-escalation";
import { performHandoff, performOrderLookup } from "@/lib/chatbox/widget-actions";
import { ingestVisitorMessage } from "@/lib/inbox/visitor-ingest";
import { publishConversationTyping } from "@/lib/inbox/typing";
import { toApiMessage } from "@/lib/inbox/mappers";
import { selectConversationMessagesAfter } from "@/lib/inbox/message-queries";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const afterParam = new URL(request.url).searchParams.get("after");
  const after = afterParam === null ? -1 : Number.parseInt(afterParam, 10);
  if (!Number.isFinite(after)) {
    return NextResponse.json({ error: "Invalid after parameter" }, { status: 400 });
  }

  await touchVisitorChatSession(db, sessionId);

  const rows = await selectAll(
    selectConversationMessagesAfter(db, session.conversationId, after),
  );

  const widgetMessages = rows
    .filter(({ message }) => message.from === "visitor" || message.from === "operator")
    .map(({ message, author, reminder }) => toApiMessage(message, author, reminder));

  return NextResponse.json({ messages: widgetMessages });
}

export async function POST(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let text = "";
  let file: File | null = null;
  let email: string | undefined;
  let phone: string | undefined;
  let ip: string | undefined;

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

    const emailField = formData.get("email");
    email = typeof emailField === "string" ? emailField : undefined;

    const phoneField = formData.get("phone");
    phone = typeof phoneField === "string" ? phoneField : undefined;

    const ipField = formData.get("ip");
    ip = typeof ipField === "string" ? ipField : undefined;
  } else {
    let body: { text?: string; email?: string; phone?: string; ip?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    text = body.text?.trim() ?? "";
    email = body.email;
    phone = body.phone;
    ip = body.ip;
  }

  if (!text && !file) {
    return NextResponse.json({ error: "Message text or file is required" }, { status: 400 });
  }

  if (email !== undefined || phone !== undefined) {
    await updateVisitorSessionIdentity(db, sessionId, session.conversationId, {
      email,
      phone,
    });
  }

  const refreshedSession = (await getVisitorChatSession(db, sessionId)) ?? session;
  const identityError = await assertVisitorCanSendMessage(
    db,
    session.workspaceId,
    refreshedSession,
  );
  if (identityError) {
    return NextResponse.json({ error: identityError }, { status: 403 });
  }

  const meta = {
    email: refreshedSession.email ?? undefined,
    ip: ip ?? refreshedSession.ip ?? undefined,
  };

  if (await isVisitorBlocked(db, session.workspaceId, meta)) {
    return NextResponse.json({ error: "Visitor is blocked" }, { status: 403 });
  }

  await touchVisitorChatSession(db, sessionId);

  let attachment = null;
  let messageId: string | undefined;

  if (file) {
    const uploaded = await uploadChatboxAttachment(db, session.workspaceId, file);
    if (!uploaded.ok) {
      return NextResponse.json({ error: uploaded.error }, { status: uploaded.status });
    }
    messageId = uploaded.attachment.messageId;
    attachment = {
      url: uploaded.attachment.url,
      name: uploaded.attachment.name,
      mime: uploaded.attachment.mime,
      size: uploaded.attachment.size,
    };
  }

  const result = await ingestVisitorMessage(
    db,
    session.workspaceId,
    session.conversationId,
    text,
    { messageId, attachment: attachment ?? undefined },
  );

  if (result.dropped) {
    return NextResponse.json({
      dropped: true,
      triage: result.triage,
      message: null,
      conversation: null,
    });
  }

  publishConversationTyping(session.workspaceId, session.conversationId, "visitor", false);

  if (text && WIDGET_ESCALATE_RE.test(text)) {
    await performHandoff(db, refreshedSession, {
      email: refreshedSession.email ?? undefined,
      name: refreshedSession.visitorNickname ?? undefined,
    });
    return NextResponse.json({
      dropped: false,
      message: result.message,
      conversation: result.conversation,
      triage: result.triage,
      escalated: true,
      humanMode: true,
      aiReply: null,
    });
  }

  const orderNumber = text ? extractOrderNumber(text) : null;
  if (orderNumber && refreshedSession.email) {
    await performOrderLookup(db, refreshedSession, orderNumber, refreshedSession.email);
    return NextResponse.json({
      dropped: false,
      message: result.message,
      conversation: result.conversation,
      triage: result.triage,
      lookup: true,
      aiReply: null,
    });
  }

  const humanMode = await conversationNeedsHuman(db, session.conversationId);
  const aiReply = humanMode
    ? null
    : await maybeSendChatAiReply(db, session.workspaceId, session.conversationId, {
        customerName: refreshedSession.visitorNickname,
        customerEmail: refreshedSession.email,
        messageText: text,
      });

  return NextResponse.json({
    dropped: false,
    message: result.message,
    conversation: result.conversation,
    triage: result.triage,
    humanMode,
    aiReply,
  });
}
