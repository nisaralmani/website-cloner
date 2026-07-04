import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import {
  getChatboxMaxAttachmentBytes,
  setChatboxMaxAttachmentBytes,
  validateChatboxMaxAttachmentBytes,
} from "@/lib/chatbox/attachment-preferences";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const maxBytes = await getChatboxMaxAttachmentBytes(db, session.workspace.id);

  return NextResponse.json({ maxBytes });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { maxBytes?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.maxBytes !== "number") {
    return NextResponse.json({ error: "maxBytes is required" }, { status: 400 });
  }

  const validationError = validateChatboxMaxAttachmentBytes(body.maxBytes);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const db = await getDb();
  const maxBytes = await setChatboxMaxAttachmentBytes(db, session.workspace.id, body.maxBytes);

  return NextResponse.json({ maxBytes });
}
