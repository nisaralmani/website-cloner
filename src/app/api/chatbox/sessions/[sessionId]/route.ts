import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { conversations, visitorChatSessions } from "@/db/schema";
import { getVisitorChatSession } from "@/lib/chatbox/visitor-session";
import {
  assertVisitorCanSendMessage,
  updateVisitorSessionIdentity,
} from "@/lib/chatbox/visitor-identity-preferences";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { email?: string; phone?: string; visitorNickname?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.email !== undefined || body.phone !== undefined) {
    await updateVisitorSessionIdentity(db, sessionId, session.conversationId, {
      email: body.email,
      phone: body.phone,
    });

    const email = body.email?.trim();
    if (email) {
      const { backfillOrderContextForConversation } = await import(
        "@/lib/integrations/order-backfill-resolver"
      );
      void backfillOrderContextForConversation(
        db,
        session.workspaceId,
        session.conversationId,
        email,
      );
    }
  }

  if (body.visitorNickname?.trim()) {
    const nickname = body.visitorNickname.trim();
    await db
      .update(visitorChatSessions)
      .set({ visitorNickname: nickname })
      .where(eq(visitorChatSessions.id, sessionId));
    await db
      .update(conversations)
      .set({ name: nickname })
      .where(eq(conversations.id, session.conversationId));
  }

  const refreshed = (await getVisitorChatSession(db, sessionId)) ?? session;
  const identityError = await assertVisitorCanSendMessage(
    db,
    session.workspaceId,
    refreshed,
  );

  return NextResponse.json({
    sessionId: refreshed.id,
    email: refreshed.email,
    phone: refreshed.phone,
    visitorNickname: refreshed.visitorNickname,
    identityComplete: !identityError,
  });
}
