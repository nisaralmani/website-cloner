import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { emailVerificationTokens, users } from "@/db/schema";
import { fromBooleanFlag } from "@/lib/auth/flags";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + VERIFY_TOKEN_TTL_MS);

  const db = await getDb();
  await db.insert(emailVerificationTokens).values({
    tokenHash,
    userId,
    expiresAt,
    createdAt: now,
    usedAt: null,
  });

  return { token, expiresAt };
}

export async function getValidVerificationToken(token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();
  const db = await getDb();

  return selectOne(
    db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          gt(emailVerificationTokens.expiresAt, now),
          isNull(emailVerificationTokens.usedAt),
        ),
      ),
  );
}

export async function verifyEmailWithToken(token: string) {
  const row = await getValidVerificationToken(token);
  if (!row) {
    return false;
  }

  const db = await getDb();
  await db
    .update(users)
    .set({ emailVerified: fromBooleanFlag(true) })
    .where(eq(users.id, row.userId));
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.tokenHash, row.tokenHash));

  return true;
}

import { appUrl, APP_AUTH_VERIFY_PATH } from "@/lib/marketing-paths";

export function buildVerifyUrl(_origin: string, token: string) {
  return `${appUrl(APP_AUTH_VERIFY_PATH)}?token=${encodeURIComponent(token)}`;
}

export function shouldExposeVerifyUrl() {
  return (
    process.env.EMAIL_VERIFICATION_DEBUG === "1" ||
    (process.env.NODE_ENV !== "production" && process.env.EMAIL_VERIFICATION_DEBUG !== "0")
  );
}
