import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  bulkAssignConversations,
  parseBulkConversationIds,
  validateBulkAssignOperator,
} from "@/lib/inbox/bulk-assignment";
import { publishConversationUpdated } from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { conversationIds?: unknown; assignedOperatorId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.assignedOperatorId === undefined) {
    return NextResponse.json({ error: "assignedOperatorId is required" }, { status: 400 });
  }

  const parsedIds = parseBulkConversationIds(body.conversationIds);
  if ("error" in parsedIds) {
    return NextResponse.json({ error: parsedIds.error }, { status: 400 });
  }

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const parsedOperator = await validateBulkAssignOperator(
    db,
    workspaceId,
    body.assignedOperatorId,
  );
  if ("error" in parsedOperator) {
    return NextResponse.json({ error: parsedOperator.error }, { status: 400 });
  }

  const result = await bulkAssignConversations(
    db,
    workspaceId,
    parsedIds.conversationIds,
    parsedOperator.operatorId,
  );

  if (!result.ok) {
    return NextResponse.json({ error: "One or more conversations were not found" }, { status: 404 });
  }

  const conversationList = await fetchWorkspaceConversations(workspaceId);
  publishConversationUpdated(workspaceId, conversationList);

  return NextResponse.json({
    updatedCount: result.updatedCount,
    conversations: result.conversations,
  });
}
