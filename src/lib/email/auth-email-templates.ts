import { appHomeUrl } from "@/lib/marketing-paths";
import { BRAND_NAME } from "@/lib/brand";

export function passwordResetEmail(resetUrl: string) {
  const subject = `Reset your ${BRAND_NAME} password`;
  const text = [
    `You requested a password reset for your ${BRAND_NAME} account.`,
    "",
    `Reset your password: ${resetUrl}`,
    "",
    "If you did not request this, you can ignore this email.",
    "",
    `${BRAND_NAME} · ${appHomeUrl()}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#1c293b;max-width:480px;margin:0 auto;padding:24px">
  <p>You requested a password reset for your ${BRAND_NAME} account.</p>
  <p><a href="${resetUrl}" style="display:inline-block;background:#1972F5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Reset password</a></p>
  <p style="font-size:14px;color:#64748b">Or copy this link: ${resetUrl}</p>
  <p style="font-size:14px;color:#64748b">If you did not request this, you can ignore this email.</p>
</body>
</html>`;

  return { subject, text, html };
}

export function emailVerificationEmail(verifyUrl: string) {
  const subject = `Verify your ${BRAND_NAME} email address`;
  const text = [
    `Confirm your email address to finish setting up your ${BRAND_NAME} account.`,
    "",
    `Verify email: ${verifyUrl}`,
    "",
    "If you did not create an account, you can ignore this email.",
    "",
    `${BRAND_NAME} · ${appHomeUrl()}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#1c293b;max-width:480px;margin:0 auto;padding:24px">
  <p>Confirm your email address to finish setting up your ${BRAND_NAME} account.</p>
  <p><a href="${verifyUrl}" style="display:inline-block;background:#1972F5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Verify email</a></p>
  <p style="font-size:14px;color:#64748b">Or copy this link: ${verifyUrl}</p>
  <p style="font-size:14px;color:#64748b">If you did not create an account, you can ignore this email.</p>
</body>
</html>`;

  return { subject, text, html };
}
