import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { createOperatorConversation } from "@/lib/inbox/create-operator-conversation";
import { publishConversationCreated } from "@/lib/inbox/event-bus";
import { processDueRemindersAndPublish } from "@/lib/inbox/process-due-reminders";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const db = await getDb();
  const conversation = await createOperatorConversation(db, session.workspace.id, body);
  const conversations = await fetchWorkspaceConversations(session.workspace.id);
  publishConversationCreated(session.workspace.id, conversations);

  return NextResponse.json({ conversation }, { status: 201 });
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const includeSnoozed = new URL(request.url).searchParams.get("includeSnoozed") === "1";
  const segment = new URL(request.url).searchParams.get("segment") ?? undefined;
  const subInboxId = new URL(request.url).searchParams.get("subInboxId") ?? undefined;
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? undefined;
  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  const assignedOperatorId =
    new URL(request.url).searchParams.get("assignedOperatorId") ?? undefined;
  const sortParam = new URL(request.url).searchParams.get("sort") ?? undefined;
  const sort =
    sortParam === "oldest" || sortParam === "unread" || sortParam === "recent"
      ? sortParam
      : "recent";
  const db = await getDb();
  await processDueRemindersAndPublish(db, session.workspace.id);
  const conversations = await fetchWorkspaceConversations(session.workspace.id, {
    includeSnoozed,
    segment,
    subInboxId,
    query,
    status,
    assignedOperatorId,
    sort,
  });

  return NextResponse.json({
    conversations,
    total: conversations.length,
  });
}