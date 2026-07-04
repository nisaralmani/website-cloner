import { NextResponse } from "next/server";
import { getDb, selectAll } from "@/db/client";
import {
  createVisitorChatSession,
  getVisitorChatSession,
  assertChatboxSessionAllowed,
  isVisitorBlocked,
  resolveWorkspaceForChatbox,
  touchVisitorChatSession,
  type VisitorSessionMeta,
} from "@/lib/chatbox/visitor-session";
import { upsertLiveVisitorFromSession } from "@/lib/visitors/live-visitor";
import { toApiMessage } from "@/lib/inbox/mappers";
import { selectConversationMessages } from "@/lib/inbox/message-queries";

function parseSessionMeta(body: Record<string, unknown>): VisitorSessionMeta {
  return {
    country: typeof body.country === "string" ? body.country : undefined,
    locale: typeof body.locale === "string" ? body.locale : undefined,
    pageUrl: typeof body.pageUrl === "string" ? body.pageUrl : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
    ip: typeof body.ip === "string" ? body.ip : undefined,
  };
}

function enrichSessionMeta(request: Request, meta: VisitorSessionMeta): VisitorSessionMeta {
  if (meta.country?.trim()) {
    return meta;
  }
  const header =
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("x-country-code");
  if (header && header.trim().length === 2) {
    return { ...meta, country: header.trim().toUpperCase() };
  }
  return meta;
}

async function listWidgetMessages(db: Awaited<ReturnType<typeof getDb>>, conversationId: string) {
  const rows = await selectAll(selectConversationMessages(db, conversationId));
  return rows
    .filter(({ message }) => message.from === "visitor" || message.from === "operator")
    .map(({ message, author, reminder }) => toApiMessage(message, author, reminder));
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = await getDb();
  const workspace = await resolveWorkspaceForChatbox(db, {
    workspaceId: typeof body.workspaceId === "string" ? body.workspaceId : undefined,
    domain: typeof body.domain === "string" ? body.domain : undefined,
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const meta = enrichSessionMeta(request, parseSessionMeta(body));
  if (await isVisitorBlocked(db, workspace.id, meta)) {
    return NextResponse.json({ error: "Visitor is blocked" }, { status: 403 });
  }

  const accessError = await assertChatboxSessionAllowed(db, workspace.id, meta, {
    userAgent: request.headers.get("user-agent"),
    workspaceDomain: workspace.domain,
    requestDomain: typeof body.domain === "string" ? body.domain : undefined,
  });
  if (accessError) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  const resumeSessionId =
    typeof body.sessionId === "string" ? body.sessionId.trim() : undefined;

  if (resumeSessionId) {
    const existing = await getVisitorChatSession(db, resumeSessionId);
    if (!existing || existing.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await touchVisitorChatSession(db, resumeSessionId);
    await upsertLiveVisitorFromSession(db, existing, {
      pageUrl: meta.pageUrl?.trim() || existing.pageUrl || undefined,
    });
    const widgetMessages = await listWidgetMessages(db, existing.conversationId);

    return NextResponse.json({
      sessionId: existing.id,
      conversationId: existing.conversationId,
      visitorNickname: existing.visitorNickname,
      workspaceId: workspace.id,
      messages: widgetMessages,
    });
  }

  const created = await createVisitorChatSession(db, workspace.id, meta);
  const widgetMessages = await listWidgetMessages(db, created.conversationId);

  return NextResponse.json({
    sessionId: created.sessionId,
    conversationId: created.conversationId,
    visitorNickname: created.visitorNickname,
    workspaceId: workspace.id,
    messages: widgetMessages,
  });
}

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await touchVisitorChatSession(db, sessionId);
  const widgetMessages = await listWidgetMessages(db, session.conversationId);

  return NextResponse.json({
    sessionId: session.id,
    conversationId: session.conversationId,
    visitorNickname: session.visitorNickname,
    workspaceId: session.workspaceId,
    messages: widgetMessages,
  });
}
