import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getAiReview } from "@/lib/ai/review-queue";
import { requireSession } from "@/lib/auth/request";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (!session?.workspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;

    const db = await getDb();
    const review = await getAiReview(db, session.workspace.id, id);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("GET /api/ai/reviews/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
