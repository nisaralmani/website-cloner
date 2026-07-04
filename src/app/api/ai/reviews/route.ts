import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getPendingReviews } from "@/lib/ai/review-service";
import { requireSession } from "@/lib/auth/request";

export async function GET() {
  try {
    // Scope to the caller's own workspace from the session — never a
    // client-supplied workspaceId — so this list endpoint enforces the same
    // tenant isolation as the sibling /api/ai/reviews/[id] routes. (This also
    // fixes the client, which calls the endpoint with no query params.)
    const session = await requireSession();
    if (!session?.workspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const reviews = await getPendingReviews(db, session.workspace.id);

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Failed to list reviews:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
