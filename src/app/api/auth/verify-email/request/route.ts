import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { users } from "@/db/schema";
import {
  buildVerifyUrl,
  createEmailVerificationToken,
  shouldExposeVerifyUrl,
} from "@/lib/auth/email-verification";
import { emailVerificationEmail } from "@/lib/email/auth-email-templates";
import { sendEmail } from "@/lib/email/send-email";
import { toBooleanFlag } from "@/lib/auth/flags";
import { requireSession } from "@/lib/auth/request";

const SENT_MESSAGE =
  "If your email address is valid, you will receive verification instructions shortly.";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const user = await selectOne(db.select().from(users).where(eq(users.id, session.user.id)));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (toBooleanFlag(user.emailVerified)) {
    return NextResponse.json({ ok: true, message: "Email is already verified." });
  }

  const { token } = await createEmailVerificationToken(user.id);
  const verifyUrl = buildVerifyUrl(new URL(request.url).origin, token);
  const emailContent = emailVerificationEmail(verifyUrl);

  const payload: { ok: true; message: string; verifyUrl?: string; emailDispatched?: boolean } = {
    ok: true,
    message: SENT_MESSAGE,
  };

  const emailResult = await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  });
  payload.emailDispatched = emailResult.ok;

  if (shouldExposeVerifyUrl()) {
    payload.verifyUrl = verifyUrl;
    console.info(`[email-verification] ${user.email}: ${verifyUrl}`);
  } else {
    console.info(`[email-verification] Verification link requested for ${user.email}`);
  }

  return NextResponse.json(payload);
}
