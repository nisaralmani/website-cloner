import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { users } from "@/db/schema";
import {
  buildResetUrl,
  createPasswordResetToken,
  shouldExposeResetUrl,
} from "@/lib/auth/password-reset";
import { passwordResetEmail } from "@/lib/email/auth-email-templates";
import { sendEmail } from "@/lib/email/send-email";

const GENERIC_MESSAGE =
  "If an account exists for this email, you will receive password reset instructions shortly.";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const db = await getDb();
  const user = await selectOne(db.select().from(users).where(eq(users.email, email)));
  const payload: { ok: true; message: string; resetUrl?: string; emailDispatched?: boolean } = {
    ok: true,
    message: GENERIC_MESSAGE,
  };

  if (user) {
    const { token } = await createPasswordResetToken(user.id);
    const resetUrl = buildResetUrl(new URL(request.url).origin, token);
    const emailContent = passwordResetEmail(resetUrl);

    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
    payload.emailDispatched = emailResult.ok;

    if (shouldExposeResetUrl()) {
      payload.resetUrl = resetUrl;
      console.info(`[password-reset] ${email}: ${resetUrl}`);
    } else {
      console.info(`[password-reset] Reset link requested for ${email}`);
    }
  }

  return NextResponse.json(payload);
}
