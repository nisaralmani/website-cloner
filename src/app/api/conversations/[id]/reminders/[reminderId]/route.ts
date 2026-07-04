import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { conversations } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { cancelConversationReminder } from "@/lib/inbox/create-reminder";

type RouteContext = { params: Promise<{ id: string; reminderId: string }> };

async function getConversationForWorkspace(id: string, workspaceId: string) {
  const db = await getDb();
  return selectOne(
    db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.workspaceId, workspaceId))),
  );
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, reminderId } = await context.params;
  const conversation = await getConversationForWorkspace(id, session.workspace.id);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  const result = await cancelConversationReminder(db, id, reminderId);

  if (!result.ok) {
    return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
  }

  return NextResponse.json({ id: reminderId });
}
