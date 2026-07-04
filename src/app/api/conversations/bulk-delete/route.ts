import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  bulkDeleteConversations,
  parseBulkConversationIds,
} from "@/lib/inbox/bulk-delete";
import { assertCanDeleteWorkspaceData } from "@/lib/workspaces/operator-permissions";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { publishConversationDeleted } from "@/lib/inbox/event-bus";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { conversationIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsedIds = parseBulkConversationIds(body.conversationIds);
  if ("error" in parsedIds) {
    return NextResponse.json({ error: parsedIds.error }, { status: 400 });
  }

  const db = await getDb();
  const permissionError = await assertCanDeleteWorkspaceData(
    db,
    session.workspace.id,
    session.role,
  );
  if (permissionError) {
    return NextResponse.json({ error: permissionError }, { status: 403 });
  }

  const result = await bulkDeleteConversations(
    db,
    session.workspace.id,
    parsedIds.conversationIds,
  );
  if (!result.ok) {
    return NextResponse.json({ error: "One or more conversations were not found" }, { status: 404 });
  }

  for (const id of result.deletedIds) {
    void deliverWorkspaceWebhooks(db, session.workspace.id, "conversation:deleted", {
      conversationId: id,
    });
  }

  const conversationList = await fetchWorkspaceConversations(session.workspace.id);
  publishConversationDeleted(session.workspace.id, conversationList);

  return NextResponse.json({ deletedIds: result.deletedIds });
}
