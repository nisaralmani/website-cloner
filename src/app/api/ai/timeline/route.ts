import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { aiAgentLog } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth/request";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    if (!session?.workspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const timeline = await db
      .select()
      .from(aiAgentLog)
      .where(
        and(
          eq(aiAgentLog.workspaceId, session.workspace.id),
          eq(aiAgentLog.conversationId, conversationId)
        )
      )
      .orderBy(desc(aiAgentLog.createdAt));

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("GET /api/ai/timeline error:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI timeline" },
      { status: 500 }
    );
  }
}
