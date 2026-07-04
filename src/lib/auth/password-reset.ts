import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { passwordResetTokens, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MS);

  const db = await getDb();
  await db.insert(passwordResetTokens).values({
    tokenHash,
    userId,
    expiresAt,
    createdAt: now,
    usedAt: null,
  });

  return { token, expiresAt };
}

export async function getValidResetToken(token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();
  const db = await getDb();

  return selectOne(
    db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          gt(passwordResetTokens.expiresAt, now),
          isNull(passwordResetTokens.usedAt),
        ),
      ),
  );
}

export async function resetPasswordWithToken(token: string, password: string) {
  const row = await getValidResetToken(token);
  if (!row) {
    return false;
  }

  const passwordHash = await hashPassword(password);
  const db = await getDb();

  await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.tokenHash, row.tokenHash));

  return true;
}

import { appUrl, APP_AUTH_RESET_PATH } from "@/lib/marketing-paths";

export function buildResetUrl(_origin: string, token: string) {
  return `${appUrl(APP_AUTH_RESET_PATH)}?token=${encodeURIComponent(token)}`;
}

export function shouldExposeResetUrl() {
  return (
    process.env.PASSWORD_RESET_DEBUG === "1" ||
    (process.env.NODE_ENV !== "production" && process.env.PASSWORD_RESET_DEBUG !== "0")
  );
}
