"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  APP_AUTH_FORGOT_PATH,
  APP_AUTH_LOGIN_PATH,
} from "@/lib/marketing-paths";
import { cn } from "@/lib/utils";
import AuthInitiateLayout from "@/components/auth/AuthInitiateLayout";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    tokenValid &&
    password.length >= 8 &&
    passwordsMatch &&
    !submitting &&
    !success;

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      return;
    }

    void (async () => {
      try {
        const response = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
        );
        const data = (await response.json()) as { valid?: boolean };
        setTokenValid(Boolean(data.valid));
      } catch {
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    })();
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Unable to reset password. Please try again.");
        return;
      }

      setSuccess(true);
      window.setTimeout(() => {
        router.push(APP_AUTH_LOGIN_PATH);
        router.refresh();
      }, 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthInitiateLayout>
      <div className="w-full max-w-[600px]">
        <div className="mb-10">
          <h1 className="text-[28px] font-semibold leading-tight text-black">
            Reset Password
          </h1>
          <p className="mt-2 text-base font-medium text-[#8D949D]">
            Choose a new password for your Bybelt account.
          </p>
        </div>

        {validating ? (
          <p className="text-sm text-[#828EA1]">Checking reset link…</p>
        ) : !tokenValid ? (
          <div>
            <p className="rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
              This reset link is invalid or has expired.
            </p>
            <p className="mt-9 text-sm">
              <Link
                href={APP_AUTH_FORGOT_PATH}
                className="font-semibold text-[#333E4F] underline"
              >
                Request a new reset link
              </Link>
            </p>
          </div>
        ) : (
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <label className="mb-5 block">
              <span className="mb-1.5 flex text-[15px] font-bold text-[#606976]">
                New password <span className="text-[#E11900]">*</span>
              </span>
              <span className="flex h-11 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your new password…"
                  className="w-full bg-transparent text-[15px] text-[#1c293b] outline-none placeholder:text-[#828ea1]"
                />
              </span>
            </label>

            <label className="mb-5 block">
              <span className="mb-1.5 flex text-[15px] font-bold text-[#606976]">
                Confirm password <span className="text-[#E11900]">*</span>
              </span>
              <span className="flex h-11 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your new password…"
                  className="w-full bg-transparent text-[15px] text-[#1c293b] outline-none placeholder:text-[#828ea1]"
                />
              </span>
            </label>

            {password.length > 0 && password.length < 8 ? (
              <p className="mb-4 text-sm text-[#828EA1]">
                Password must be at least 8 characters.
              </p>
            ) : null}

            {confirmPassword.length > 0 && !passwordsMatch ? (
              <p className="mb-4 text-sm text-[#B91C1C]">Passwords do not match.</p>
            ) : null}

            {error ? (
              <p className="mb-4 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="mb-4 rounded border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-sm text-[#166534]">
                Password updated. Redirecting to login…
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "h-12 w-full rounded border border-black/10 text-[15px] font-semibold text-white transition-colors",
                canSubmit ? "bg-[#1972F5]" : "cursor-not-allowed bg-[#1972F5]/40",
              )}
            >
              {submitting ? "Updating…" : "Update password"}
            </button>

            <p className="mt-9 text-sm">
              <Link href={APP_AUTH_LOGIN_PATH} className="font-semibold text-[#333E4F] underline">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthInitiateLayout>
  );
}
