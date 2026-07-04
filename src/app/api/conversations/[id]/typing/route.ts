import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { conversations } from "@/db/schema";
import { requireSession } from "@/lib/auth/request";
import { publishConversationTyping } from "@/lib/inbox/typing";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { typing?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.typing !== "boolean") {
    return NextResponse.json({ error: "typing boolean is required" }, { status: 400 });
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

  const operatorName =
    [session.user.firstName, session.user.lastName].filter(Boolean).join(" ").trim() ||
    session.user.email;

  publishConversationTyping(
    session.workspace.id,
    id,
    "operator",
    body.typing,
    operatorName,
  );

  return NextResponse.json({ ok: true });
}
