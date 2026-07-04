import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { reopenReview } from "@/lib/ai/review-service";
import { requireSession } from "@/lib/auth/request";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (!session?.workspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;

    const db = await getDb();
    const result = await reopenReview(db, session.workspace.id, id, session.user.id);

    if (!result) {
      return NextResponse.json({ error: "Review not found or invalid state" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/ai/reviews/[id]/reopen error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
