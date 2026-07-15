import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectAll, selectOne } from "@/db/client";
import { conversations } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { selectConversationMessages } from "@/lib/inbox/message-queries";
import { toApiMessage } from "@/lib/inbox/mappers";
import { sendEmail } from "@/lib/email/send-email";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { to?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const to = body.to?.trim();
  if (!to) {
    return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
  }

  const db = await getDb();
  const conversation = await selectOne(
    db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.workspaceId, session.workspace.id))),
  );

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messageRows = await selectAll(selectConversationMessages(db, id));
  const messages = messageRows
    .map(({ message, author, reminder }) => toApiMessage(message, author, reminder))
    .filter((message) => message.from === "visitor" || message.from === "operator");

  const lines = messages.map((message) => {
    const speaker = message.from === "visitor" ? conversation.name : "Operator";
    return `[${message.time}] ${speaker}: ${message.text}`;
  });

  const text = [`Transcript of conversation with ${conversation.name}`, "", ...lines].join("\n");

  const result = await sendEmail({
    to,
    subject: `Transcript: ${conversation.name}`,
    text,
    workspaceId: session.workspace.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to send transcript" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
