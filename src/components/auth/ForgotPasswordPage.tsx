"use client";

import Link from "next/link";
import { useState } from "react";
import { APP_AUTH_LOGIN_PATH } from "@/lib/marketing-paths";
import { cn } from "@/lib/utils";
import AuthInitiateLayout from "@/components/auth/AuthInitiateLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const canSubmit = email.trim().length > 0 && !submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);
    setDevResetUrl(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
        resetUrl?: string;
      } | null;

      if (!response.ok) {
        setError(data?.error ?? "Unable to process request. Please try again.");
        return;
      }

      setMessage(
        data?.message ??
          "If an account exists for this email, you will receive password reset instructions shortly.",
      );
      if (data?.resetUrl) {
        setDevResetUrl(data.resetUrl);
      }
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
            Forgot Password?
          </h1>
          <p className="mt-2 text-base font-medium text-[#8D949D]">
            Enter your email address and we&apos;ll send you instructions to reset your
            password.
          </p>
        </div>

        <form className="flex flex-col" onSubmit={handleSubmit}>
          <label className="mb-5 block">
            <span className="mb-1.5 flex text-[15px] font-bold text-[#606976]">
              Email address <span className="text-[#E11900]">*</span>
            </span>
            <span className="flex h-11 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email…"
                className="w-full bg-transparent text-[15px] font-semibold text-[#1c293b] outline-none placeholder:font-normal placeholder:text-[#828ea1]"
              />
            </span>
          </label>

          {error ? (
            <p className="mb-4 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mb-4 rounded border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-sm text-[#166534]">
              {message}
            </p>
          ) : null}

          {devResetUrl ? (
            <p className="mb-4 rounded border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-sm text-[#1D4ED8]">
              Dev reset link:{" "}
              <a href={devResetUrl} className="break-all font-semibold underline">
                {devResetUrl}
              </a>
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
            {submitting ? "Sending…" : "Send reset instructions"}
          </button>

          <p className="mt-9 text-sm">
            <Link href={APP_AUTH_LOGIN_PATH} className="font-semibold text-[#333E4F] underline">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </AuthInitiateLayout>
  );
}
