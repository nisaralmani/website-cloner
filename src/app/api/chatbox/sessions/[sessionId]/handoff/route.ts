import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getVisitorChatSession } from "@/lib/chatbox/visitor-session";
import { performHandoff } from "@/lib/chatbox/widget-actions";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = await performHandoff(db, session, body);
  return NextResponse.json(result);
}
