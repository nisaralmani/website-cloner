import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { conversationSegments, conversations } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { buildCustomerDetailsForConversation } from "@/lib/inbox/conversation-details";
import { toConversationWithAssignee } from "@/lib/inbox/mappers";
import { selectConversationWithAssignee } from "@/lib/inbox/conversation-queries";
import {
  fetchSegmentsForConversation,
  parseConversationSegmentInput,
} from "@/lib/inbox/conversation-segments";

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

async function buildPayload(conversationId: string, workspaceId: string) {
  const db = await getDb();
  const joined = await selectOne(selectConversationWithAssignee(db, conversationId, workspaceId));
  if (!joined) {
    return null;
  }

  const segments = await fetchSegmentsForConversation(db, conversationId);

  return {
    conversation: toConversationWithAssignee(joined.conversation, joined.assignee, segments),
    details: await buildCustomerDetailsForConversation(db, joined.conversation, conversationId),
  };
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { segment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseConversationSegmentInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const conversation = await getConversationForWorkspace(id, session.workspace.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  await db
    .insert(conversationSegments)
    .values({
      conversationId: id,
      segment: parsed.segment,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  const payload = await buildPayload(id, session.workspace.id);
  if (!payload) {
    return NextResponse.json({ error: "Failed to load conversation details" }, { status: 500 });
  }

  return NextResponse.json({
    segment: parsed.segment,
    ...payload,
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { segment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseConversationSegmentInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const conversation = await getConversationForWorkspace(id, session.workspace.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  await db
    .delete(conversationSegments)
    .where(
      and(
        eq(conversationSegments.conversationId, id),
        eq(conversationSegments.segment, parsed.segment),
      ),
    );

  const payload = await buildPayload(id, session.workspace.id);
  if (!payload) {
    return NextResponse.json({ error: "Failed to load conversation details" }, { status: 500 });
  }

  return NextResponse.json(payload);
}
