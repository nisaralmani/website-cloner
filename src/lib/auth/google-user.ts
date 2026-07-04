import { and, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { oauthAccounts, users } from "@/db/schema";
import type { GoogleProfile } from "@/lib/auth/google";
import { verifyPassword } from "@/lib/auth/password";

export async function findUserByOAuth(provider: string, providerUserId: string) {
  const db = await getDb();
  const link = await selectOne(
    db
      .select()
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.provider, provider),
          eq(oauthAccounts.providerUserId, providerUserId),
        ),
      ),
  );

  if (!link) return null;

  return selectOne(db.select().from(users).where(eq(users.id, link.userId)));
}

export async function linkOAuthAccount(
  provider: string,
  profile: GoogleProfile,
  userId: string,
) {
  const db = await getDb();
  await db
    .insert(oauthAccounts)
    .values({
      provider,
      providerUserId: profile.sub,
      userId,
      email: profile.email.toLowerCase(),
      linkedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [oauthAccounts.provider, oauthAccounts.providerUserId],
      set: {
        userId,
        email: profile.email.toLowerCase(),
        linkedAt: new Date(),
      },
    });
}

export async function resolveGoogleUser(profile: GoogleProfile) {
  const existingOAuthUser = await findUserByOAuth("google", profile.sub);
  if (existingOAuthUser) {
    return existingOAuthUser;
  }

  const email = profile.email.toLowerCase();
  const db = await getDb();
  const existingEmailUser = await selectOne(
    db.select().from(users).where(eq(users.email, email)),
  );

  if (existingEmailUser) {
    await linkOAuthAccount("google", profile, existingEmailUser.id);
    return existingEmailUser;
  }

  return null;
}

export async function isOAuthLinkedForUser(userId: string, provider: string) {
  const db = await getDb();
  const link = await selectOne(
    db
      .select({ provider: oauthAccounts.provider })
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider))),
  );
  return Boolean(link);
}

export async function unlinkOAuthAccount(userId: string, provider: string, password: string) {
  const db = await getDb();
  const user = await selectOne(db.select().from(users).where(eq(users.id, userId)));
  if (!user?.passwordHash) {
    return { ok: false as const, error: "Password is required to unlink OAuth" };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return { ok: false as const, error: "Invalid password" };
  }

  const link = await selectOne(
    db
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider))),
  );

  if (!link) {
    return { ok: false as const, reason: "not_linked" as const };
  }

  await db
    .delete(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, provider)));

  return { ok: true as const };
}
