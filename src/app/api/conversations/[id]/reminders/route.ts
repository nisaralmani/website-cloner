import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { conversations } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { createConversationReminder } from "@/lib/inbox/create-reminder";
import { operatorDisplayName } from "@/lib/workspaces/operators";
import {
  publishConversationUpdated,
  publishMessageCreated,
} from "@/lib/inbox/event-bus";
import { selectActiveConversationReminders } from "@/lib/inbox/message-queries";
import { parseReminderInput } from "@/lib/inbox/reminders";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";

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

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const conversation = await getConversationForWorkspace(id, session.workspace.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  const rows = await selectAll(selectActiveConversationReminders(db, id));

  return NextResponse.json({
    reminders: rows.map(({ reminder, author }) => ({
      id: reminder.id,
      messageId: reminder.messageId,
      note: reminder.note,
      remindAt: reminder.remindAt.toISOString(),
      createdAt: reminder.createdAt.toISOString(),
      author: {
        id: author.id,
        name: operatorDisplayName(author),
        avatarGradient: author.avatarGradient,
      },
    })),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { note?: string; remindAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseReminderInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const conversation = await getConversationForWorkspace(id, session.workspace.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  const created = await createConversationReminder(
    db,
    id,
    session.user.id,
    parsed.note,
    parsed.remindAt,
  );

  if (!created) {
    return NextResponse.json({ error: "Failed to save reminder" }, { status: 500 });
  }

  const workspaceId = session.workspace.id;
  publishMessageCreated(workspaceId, id, [created.message]);
  const conversationList = await fetchWorkspaceConversations(workspaceId);
  publishConversationUpdated(workspaceId, conversationList);

  return NextResponse.json({
    message: created.message,
    reminder: {
      id: created.reminderId,
      note: parsed.note,
      remindAt: parsed.remindAt.toISOString(),
    },
  });
}
