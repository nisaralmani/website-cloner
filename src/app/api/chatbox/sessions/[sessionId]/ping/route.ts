import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { visitorChatSessions } from "@/db/schema";
import {
  getVisitorChatSession,
  touchVisitorChatSession,
} from "@/lib/chatbox/visitor-session";
import { upsertLiveVisitorFromSession } from "@/lib/visitors/live-visitor";
import { clientIpFromRequest, lookupVisitorGeo } from "@/lib/visitors/geo";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const db = await getDb();
  const session = await getVisitorChatSession(db, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let body: { pageUrl?: string; latitude?: number; longitude?: number } = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as typeof body;
    }
  } catch {
    // Empty body is allowed.
  }

  const pageUrl = typeof body.pageUrl === "string" ? body.pageUrl.trim() : "";
  if (pageUrl && pageUrl !== session.pageUrl) {
    await db
      .update(visitorChatSessions)
      .set({ pageUrl })
      .where(eq(visitorChatSessions.id, sessionId));
    session.pageUrl = pageUrl;
  }

  await touchVisitorChatSession(db, sessionId);

  const geo = await lookupVisitorGeo(clientIpFromRequest(request));
  const visitorId = await upsertLiveVisitorFromSession(db, session, {
    pageUrl: pageUrl || session.pageUrl || undefined,
    latitude: typeof body.latitude === "number" ? body.latitude : undefined,
    longitude: typeof body.longitude === "number" ? body.longitude : undefined,
    geo,
  });

  return NextResponse.json({ ok: true, visitorId });
}
