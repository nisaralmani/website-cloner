import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { users } from "@/db/schema";
import { parsePresenceStatus } from "@/lib/auth/presence";
import { requireSession } from "@/lib/auth/request";
import { toPublicUser } from "@/lib/auth/user";

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const status = parsePresenceStatus(body.status);
  if (!status) {
    return NextResponse.json({ error: "status must be online or offline" }, { status: 400 });
  }

  const db = await getDb();
  await db.update(users).set({ presenceStatus: status }).where(eq(users.id, session.user.id));

  const user = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: toPublicUser(user) });
}
