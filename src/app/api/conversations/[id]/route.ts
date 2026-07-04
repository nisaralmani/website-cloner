import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { conversations } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import {
  toApiMessage,
  toConversationWithAssignee,
} from "@/lib/inbox/mappers";
import {
  isWorkspaceOperator,
  parseAssignedOperatorInput,
} from "@/lib/inbox/conversation-assignment";
import { buildCustomerDetailsForConversation } from "@/lib/inbox/conversation-details";
import { isConversationStatus } from "@/lib/inbox/conversation-status";
import { parseCustomerEmailInput } from "@/lib/inbox/customer-email";
import { selectConversationWithAssignee } from "@/lib/inbox/conversation-queries";
import { fetchSegmentsForConversation } from "@/lib/inbox/conversation-segments";
import { selectConversationMessages } from "@/lib/inbox/message-queries";
import { validateConversationUnread } from "@/lib/inbox/unread";
import {
  publishConversationDeleted,
  publishConversationUpdated,
} from "@/lib/inbox/event-bus";
import { fetchWorkspaceConversations } from "@/lib/inbox/snapshot";
import { markVisitorMessagesRead } from "@/lib/inbox/message-receipts";
import { deleteConversation } from "@/lib/inbox/delete-conversation";
import { deliverWorkspaceWebhooks } from "@/lib/workspaces/webhook-delivery";
import { assertCanDeleteWorkspaceData } from "@/lib/workspaces/operator-permissions";
import { backfillOrderContextForConversation } from "@/lib/integrations/order-backfill-resolver";

type RouteContext = { params: Promise<{ id: string }> };

async function getConversationRowForWorkspace(id: string, workspaceId: string) {
  const db = await getDb();
  return selectOne(
    db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.workspaceId, workspaceId))),
  );
}

async function getConversationWithAssigneeForWorkspace(id: string, workspaceId: string) {
  const db = await getDb();
  return selectOne(selectConversationWithAssignee(db, id, workspaceId));
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const joined = await getConversationWithAssigneeForWorkspace(id, session.workspace.id);

  if (!joined) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  const messageRows = await selectAll(selectConversationMessages(db, id));

  const segments = await fetchSegmentsForConversation(db, id);
  const details = await buildCustomerDetailsForConversation(db, joined.conversation, id);

  return NextResponse.json({
    conversation: toConversationWithAssignee(joined.conversation, joined.assignee, segments),
    messages: messageRows.map(({ message, author, reminder }) =>
      toApiMessage(message, author, reminder),
    ),
    details,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: {
    status?: string;
    unread?: number;
    customerEmail?: string | null;
    assignedOperatorId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const hasStatus = body.status !== undefined;
  const hasUnread = body.unread !== undefined;
  const hasCustomerEmail = body.customerEmail !== undefined;
  const hasAssignedOperator = body.assignedOperatorId !== undefined;

  if (!hasStatus && !hasUnread && !hasCustomerEmail && !hasAssignedOperator) {
    return NextResponse.json({ error: "No conversation fields to update" }, { status: 400 });
  }

  const updates: {
    status?: string;
    unread?: number;
    customerEmail?: string | null;
    assignedOperatorId?: string | null;
  } = {};

  if (hasStatus) {
    const status = body.status?.trim() ?? "";
    if (!isConversationStatus(status)) {
      return NextResponse.json({ error: "Invalid conversation status" }, { status: 400 });
    }
    updates.status = status;
  }

  if (hasUnread) {
    const unreadError = validateConversationUnread(body.unread);
    if (unreadError) {
      return NextResponse.json({ error: unreadError }, { status: 400 });
    }
    updates.unread = body.unread;
  }

  if (hasCustomerEmail) {
    const parsed = parseCustomerEmailInput(body.customerEmail);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    updates.customerEmail = parsed.email;
  }

  if (hasAssignedOperator) {
    const parsed = parseAssignedOperatorInput(body.assignedOperatorId);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (parsed.operatorId) {
      const db = await getDb();
      const isMember = await isWorkspaceOperator(db, session.workspace.id, parsed.operatorId);
      if (!isMember) {
        return NextResponse.json({ error: "Operator is not in this workspace" }, { status: 400 });
      }
    }

    updates.assignedOperatorId = parsed.operatorId;
  }

  const existing = await getConversationRowForWorkspace(id, session.workspace.id);
  if (!existing) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  await db.update(conversations).set(updates).where(eq(conversations.id, id));

  if (hasUnread && updates.unread === 0) {
    await markVisitorMessagesRead(db, session.workspace.id, id);
  }

  const joined = await getConversationWithAssigneeForWorkspace(id, session.workspace.id);
  if (!joined) {
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }

  const segments = await fetchSegmentsForConversation(db, id);
  const conversation = toConversationWithAssignee(joined.conversation, joined.assignee, segments);
  const details = await buildCustomerDetailsForConversation(db, joined.conversation, id);
  const workspaceId = session.workspace.id;

  if (hasStatus || hasUnread || hasAssignedOperator) {
    const conversationList = await fetchWorkspaceConversations(workspaceId);
    publishConversationUpdated(workspaceId, conversationList);
  }

  if (hasStatus && updates.status) {
    void deliverWorkspaceWebhooks(db, workspaceId, "conversation:status", {
      conversationId: id,
      status: updates.status,
    });
  }

  if (hasAssignedOperator) {
    void deliverWorkspaceWebhooks(db, workspaceId, "conversation:assigned", {
      conversationId: id,
      assignedOperatorId: updates.assignedOperatorId ?? null,
    });
  }

  if (hasCustomerEmail && updates.customerEmail) {
    void backfillOrderContextForConversation(db, workspaceId, id, updates.customerEmail);
  }

  return NextResponse.json({ conversation, details });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = await getDb();

  const permissionError = await assertCanDeleteWorkspaceData(
    db,
    session.workspace.id,
    session.role,
  );
  if (permissionError) {
    return NextResponse.json({ error: permissionError }, { status: 403 });
  }

  const result = await deleteConversation(db, session.workspace.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  void deliverWorkspaceWebhooks(db, session.workspace.id, "conversation:deleted", {
    conversationId: id,
  });

  const conversationList = await fetchWorkspaceConversations(session.workspace.id);
  publishConversationDeleted(session.workspace.id, conversationList);

  return NextResponse.json({ id: result.id });
}
