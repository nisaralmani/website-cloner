import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { users } from "@/db/schema";
import { removeUserAvatarFiles, saveUserAvatar } from "@/lib/auth/avatar";
import { normalizeProfileInput } from "@/lib/auth/profile";
import { requireSession } from "@/lib/auth/request";
import { toPublicUser } from "@/lib/auth/user";

function avatarResponse(user: typeof users.$inferSelect) {
  return {
    avatarUrl: user.avatarUrl,
    profile: normalizeProfileInput(user),
    user: toPublicUser(user),
  };
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "avatar file is required" }, { status: 400 });
  }

  const saved = await saveUserAvatar(session.user.id, file);
  if ("error" in saved) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }

  const { avatarUrl } = saved;

  const db = await getDb();
  await db.update(users).set({ avatarUrl }).where(eq(users.id, session.user.id));

  const user = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(avatarResponse(user));
}

export async function DELETE() {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  removeUserAvatarFiles(session.user.id);

  const db = await getDb();
  await db.update(users).set({ avatarUrl: null }).where(eq(users.id, session.user.id));

  const user = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(avatarResponse(user));
}
