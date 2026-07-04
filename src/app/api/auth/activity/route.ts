import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { users } from "@/db/schema";
import { presenceForAppActivity } from "@/lib/auth/app-presence";
import { requireSession } from "@/lib/auth/request";
import { toPublicUser } from "@/lib/auth/user";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });
  }

  const db = await getDb();
  const user = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const nextPresence = presenceForAppActivity(user, body.active);
  if (nextPresence && nextPresence !== user.presenceStatus) {
    await db
      .update(users)
      .set({ presenceStatus: nextPresence })
      .where(eq(users.id, session.user.id));
  }

  const updated = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    active: body.active,
    presence: updated.presenceStatus,
    user: toPublicUser(updated),
  });
}
