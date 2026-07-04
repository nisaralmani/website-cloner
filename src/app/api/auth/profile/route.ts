import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { users } from "@/db/schema";
import { combineDisplayName, normalizeProfileInput, sanitizeProfilePatch, validateProfilePatch, type ProfileFieldKey } from "@/lib/auth/profile";
import { fromBooleanFlag } from "@/lib/auth/flags";
import { requireSession } from "@/lib/auth/request";
import { toPublicUser } from "@/lib/auth/user";

function profileResponse(user: typeof users.$inferSelect) {
  return {
    profile: normalizeProfileInput(user),
    user: toPublicUser(user),
  };
}

export async function GET() {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const user = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(profileResponse(user));
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<Record<ProfileFieldKey, string>>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const patch = sanitizeProfilePatch(body);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No profile fields provided" }, { status: 400 });
  }

  const errors = validateProfilePatch(patch);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  const db = await getDb();
  const current = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!current) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (patch.email && patch.email !== current.email) {
    const taken = await selectOne(
      db
        .select()
        .from(users)
        .where(and(eq(users.email, patch.email), ne(users.id, session.user.id))),
    );
    if (taken) {
      return NextResponse.json({ error: "email is already in use" }, { status: 409 });
    }
  }

  const nextFirstName = patch.firstName ?? current.firstName ?? "";
  const nextLastName = patch.lastName ?? current.lastName ?? "";
  const nextName =
    patch.firstName !== undefined || patch.lastName !== undefined
      ? combineDisplayName(nextFirstName, nextLastName) || current.name
      : current.name;

  await db
    .update(users)
    .set({
      ...(patch.firstName !== undefined ? { firstName: patch.firstName } : {}),
      ...(patch.lastName !== undefined ? { lastName: patch.lastName } : {}),
      ...(patch.email !== undefined ? { email: patch.email } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone || null } : {}),
      ...(patch.firstName !== undefined || patch.lastName !== undefined ? { name: nextName } : {}),
      ...(patch.email !== undefined && patch.email !== current.email
        ? { emailVerified: fromBooleanFlag(false) }
        : {}),
    })
    .where(eq(users.id, session.user.id));

  const user = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(profileResponse(user));
}
