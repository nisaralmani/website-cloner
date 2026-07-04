import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getVisitorChatSession } from "@/lib/chatbox/visitor-session";
import { performOrderLookup } from "@/lib/chatbox/widget-actions";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { orderNumber?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderNumber = body.orderNumber?.trim();
  const email = body.email?.trim();
  if (!orderNumber || !email) {
    return NextResponse.json({ error: "orderNumber and email are required" }, { status: 400 });
  }

  const result = await performOrderLookup(db, session, orderNumber, email);
  return NextResponse.json(result);
}
