import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requireSession } from "@/lib/auth/request";
import { getAiAgentMetrics } from "@/lib/email/ai-agent-log";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = Number(new URL(request.url).searchParams.get("days") || "30");
  const db = await getDb();
  const metrics = await getAiAgentMetrics(db, session.workspace.id, Number.isFinite(days) ? days : 30);
  return NextResponse.json(metrics);
}
