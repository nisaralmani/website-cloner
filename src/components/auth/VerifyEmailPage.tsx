"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_AUTH_LOGIN_PATH, appSettingsPath } from "@/lib/marketing-paths";
import AuthInitiateLayout from "@/components/auth/AuthInitiateLayout";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      return;
    }

    void (async () => {
      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
        );
        const data = (await response.json()) as { valid?: boolean };
        if (!data.valid) return;

        setSubmitting(true);
        const confirm = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!confirm.ok) {
          const payload = (await confirm.json()) as { error?: string };
          throw new Error(payload.error ?? "Unable to verify email.");
        }
        setSuccess(true);
      } catch (verifyError) {
        setError(
          verifyError instanceof Error
            ? verifyError.message
            : "Unable to verify email.",
        );
      } finally {
        setSubmitting(false);
        setValidating(false);
      }
    })();
  }, [token]);

  return (
    <AuthInitiateLayout>
      <div className="mx-auto w-full max-w-[420px] px-6 py-10">
        <h1 className="text-center text-2xl font-bold text-[#1c293b]">Verify your email</h1>

        {validating || submitting ? (
          <p className="mt-6 text-center text-sm text-[#606976]">Verifying your email address…</p>
        ) : success ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm text-[#2c405a]">Your email address has been verified.</p>
            <Link
              href={appSettingsPath("account/information")}
              className="inline-flex h-10 items-center rounded bg-[#1972F5] px-5 text-sm font-bold text-white"
            >
              Back to account settings
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm text-[#E34850]">
              {error ??
                (token
                  ? "This verification link is invalid or has expired."
                  : "Verification link is missing.")}
            </p>
            <Link
              href={APP_AUTH_LOGIN_PATH}
              className="inline-flex text-sm font-bold text-[#1972F5] hover:underline"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </AuthInitiateLayout>
  );
}
