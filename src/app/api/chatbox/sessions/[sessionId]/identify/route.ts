import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getVisitorChatSession } from "@/lib/chatbox/visitor-session";
import { performWidgetIdentify } from "@/lib/chatbox/widget-identify";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { name?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const result = await performWidgetIdentify(db, session, {
    name: body.name,
    email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "invalid email", valid: false }, { status: 200 });
  }

  return NextResponse.json(result);
}
