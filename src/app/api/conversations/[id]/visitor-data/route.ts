import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { conversationVisitorData, conversations } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { buildCustomerDetailsForConversation } from "@/lib/inbox/conversation-details";
import { toConversationWithAssignee } from "@/lib/inbox/mappers";
import { selectConversationWithAssignee } from "@/lib/inbox/conversation-queries";
import { fetchSegmentsForConversation } from "@/lib/inbox/conversation-segments";
import {
  parseVisitorDataInput,
  parseVisitorDataKeyInput,
  toVisitorDataEntry,
} from "@/lib/inbox/visitor-data";

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

async function buildDetailsResponse(conversationId: string, workspaceId: string) {
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

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { key?: string; value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseVisitorDataInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const conversation = await getConversationForWorkspace(id, session.workspace.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  const now = new Date();

  await db
    .insert(conversationVisitorData)
    .values({
      conversationId: id,
      dataKey: parsed.key,
      dataValue: parsed.value,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [conversationVisitorData.conversationId, conversationVisitorData.dataKey],
      set: {
        dataValue: parsed.value,
        updatedAt: now,
      },
    });

  const row = await selectOne(
    db
      .select()
      .from(conversationVisitorData)
      .where(
        and(
          eq(conversationVisitorData.conversationId, id),
          eq(conversationVisitorData.dataKey, parsed.key),
        ),
      ),
  );

  if (!row) {
    return NextResponse.json({ error: "Failed to save visitor data" }, { status: 500 });
  }

  const payload = await buildDetailsResponse(id, session.workspace.id);
  if (!payload) {
    return NextResponse.json({ error: "Failed to load conversation details" }, { status: 500 });
  }

  return NextResponse.json({
    entry: toVisitorDataEntry(row),
    ...payload,
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseVisitorDataKeyInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const conversation = await getConversationForWorkspace(id, session.workspace.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const db = await getDb();
  await db
    .delete(conversationVisitorData)
    .where(
      and(
        eq(conversationVisitorData.conversationId, id),
        eq(conversationVisitorData.dataKey, parsed.key),
      ),
    );

  const payload = await buildDetailsResponse(id, session.workspace.id);
  if (!payload) {
    return NextResponse.json({ error: "Failed to load conversation details" }, { status: 500 });
  }

  return NextResponse.json(payload);
}
