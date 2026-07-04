import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { validateNewPassword } from "@/lib/auth/password-rules";

export { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-rules";

export async function changePasswordForUser(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const validationError = validateNewPassword(newPassword);
  if (validationError) {
    return { error: validationError };
  }

  const db = await getDb();
  const user = await selectOne(db.select().from(users).where(eq(users.id, userId)));
  if (!user) {
    return { error: "User not found" as const };
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { error: "Current password is incorrect" as const };
  }

  if (await verifyPassword(newPassword, user.passwordHash)) {
    return { error: "New password must be different" as const };
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  return { ok: true as const };
}
