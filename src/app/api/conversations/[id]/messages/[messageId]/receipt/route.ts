import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { applyMessageReceipt } from "@/lib/inbox/message-receipts";

type RouteContext = { params: Promise<{ id: string; messageId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, messageId } = await context.params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.status !== "read") {
    return NextResponse.json({ error: "status must be read" }, { status: 400 });
  }

  const db = await getDb();
  const message = await applyMessageReceipt(
    db,
    session.workspace.id,
    id,
    messageId,
    "read",
    "visitor",
  );

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ message });
}
