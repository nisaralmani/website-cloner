import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  processDueRemindersAndPublish,
  processDueRemindersForWorkspace,
} from "@/lib/inbox/process-due-reminders";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { asOf?: string; publish?: boolean } = {};
  try {
    body = (await request.json()) as { asOf?: string; publish?: boolean };
  } catch {
    // Empty body is allowed.
  }

  let now = new Date();
  if (body.asOf !== undefined) {
    const parsed = new Date(body.asOf);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid asOf" }, { status: 400 });
    }
    now = parsed;
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;
  const publish = body.publish !== false;
  const result = publish
    ? await processDueRemindersAndPublish(db, workspaceId, now)
    : await processDueRemindersForWorkspace(db, workspaceId, now);

  const conversations =
    result.processedCount > 0
      ? (
          await fetchWorkspaceConversations(workspaceId)
        ).filter((conversation) => result.conversationIds.includes(conversation.id))
      : [];

  return NextResponse.json({
    processedCount: result.processedCount,
    conversationIds: result.conversationIds,
    conversations,
  });
}
