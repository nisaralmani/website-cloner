import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  bulkUpdateConversationStatus,
  parseBulkConversationIds,
} from "@/lib/inbox/bulk-status";
import { publishConversationUpdated } from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { conversationIds?: unknown; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsedIds = parseBulkConversationIds(body.conversationIds);
  if ("error" in parsedIds) {
    return NextResponse.json({ error: parsedIds.error }, { status: 400 });
  }

  if (!body.status?.trim()) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await bulkUpdateConversationStatus(
    db,
    session.workspace.id,
    parsedIds.conversationIds,
    body.status.trim(),
  );

  if (!result.ok) {
    if ("reason" in result && result.reason === "not_found") {
      return NextResponse.json({ error: "One or more conversations were not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const conversationList = await fetchWorkspaceConversations(session.workspace.id);
  publishConversationUpdated(session.workspace.id, conversationList);

  return NextResponse.json({ conversations: result.conversations });
}
