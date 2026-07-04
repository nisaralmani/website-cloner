import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getVisitorChatSession } from "@/lib/chatbox/visitor-session";
import { recordConversationRating } from "@/lib/analytics/ratings";
import { isRatingsEnabled } from "@/lib/email/behavior-preferences";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { score?: number; rating?: number; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const scoreValue = typeof body.score === "number" ? body.score : body.rating;
  if (typeof scoreValue !== "number") {
    return NextResponse.json({ error: "score (or rating) is required" }, { status: 400 });
  }

  const ratingsEnabled = await isRatingsEnabled(db, session.workspaceId);
  if (!ratingsEnabled) {
    return NextResponse.json({ error: "Ratings are disabled" }, { status: 403 });
  }

  const result = await recordConversationRating(
    db,
    session.workspaceId,
    session.conversationId,
    sessionId,
    scoreValue,
    body.comment,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, score: result.score });
}
