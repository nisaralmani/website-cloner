"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { APP_AUTH_FORGOT_PATH, APP_AUTH_GOOGLE_PATH, APP_INBOX_PATH, marketingSignupUrl } from "@/lib/marketing-paths";
import {
  AUTH_HELP_ARTICLE_TRIGGERS,
  AUTH_HELP_CATEGORY_AI_AGENT,
  AUTH_HELP_CATEGORY_APPEARANCE,
} from "@/lib/settings-help-urls";
import { cn } from "@/lib/utils";
import { BybeltLogo } from "@/components/icons";
import { PUBLIC_HELP_CENTER_URL } from "@/lib/docs-links";
import { resolveAuthRedirect } from "@/lib/auth/safe-redirect";

const LOGIN_FEATURES = [
  {
    title: "Get 2x More Sales Using Triggers",
    description:
      "Send automated messages that create a proactive customer service which converts visitors into opportunities.",
    learnMoreHref: AUTH_HELP_ARTICLE_TRIGGERS,
    image: "/images/login/triggers.png",
    imageClassName: "h-[400px] w-[310px]",
  },
  {
    title: "Customize Your Chatbox Appearance",
    description:
      "Match your brand with colors, positioning, and a chat experience that feels native to your website.",
    learnMoreHref: AUTH_HELP_CATEGORY_APPEARANCE,
    image: "/images/settings/bento-chatbox.webp",
    imageClassName: "h-[320px] w-[340px]",
  },
  {
    title: "Build Your Perfect AI Agent in 4 Steps",
    description:
      "Train Hugo to answer FAQs, qualify leads, and hand off to your team when human support is needed.",
    learnMoreHref: AUTH_HELP_CATEGORY_AI_AGENT,
    image: "/images/agent/step_1.png",
    imageClassName: "h-[360px] w-[320px]",
  },
] as const;

const ROTATION_MS = 8000;

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  google_failed: "Google sign-in failed. Please try again.",
  google_state: "Google sign-in session expired. Please try again.",
  google_no_account: "No Bybelt account exists for this Google email.",
  google_no_workspace: "Your account has no workspace assigned.",
  google_unverified: "Your Google email must be verified.",
  google_unavailable: "Google sign-in is not configured on this server.",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;
  const feature = LOGIN_FEATURES[featureIndex];

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(GOOGLE_ERROR_MESSAGES[oauthError] ?? "Unable to sign in with Google.");
    }
  }, [searchParams]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/providers");
        if (!response.ok) return;
        const data = (await response.json()) as { google?: boolean };
        setGoogleEnabled(Boolean(data.google));
      } catch {
        setGoogleEnabled(false);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFeatureIndex((index) => (index + 1) % LOGIN_FEATURES.length);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, []);

  function handleGoogleSignIn() {
    const next = searchParams.get("next");
    const params = new URLSearchParams();
    if (next && (next.startsWith("/") && !next.startsWith("//") || next.startsWith("https://"))) {
      params.set("next", next);
    }
    const query = params.toString();
    window.location.href = query ? `${APP_AUTH_GOOGLE_PATH}?${query}` : APP_AUTH_GOOGLE_PATH;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, remember }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Unable to sign in. Please try again.");
        return;
      }

      const next = searchParams.get("next");
      router.push(resolveAuthRedirect(next, APP_INBOX_PATH));
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white text-[#2c405a]">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 items-center justify-between px-6">
          <Link href={APP_INBOX_PATH}>
            <BybeltLogo markSize={32} />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <a
              href={PUBLIC_HELP_CENTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#3B86FB]"
            >
              Need help?
            </a>
            <span className="h-4 w-px bg-[#E6EAF0]" />
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#2c405a]"
            >
              <span aria-hidden>🇬🇧</span>
              English
              <ChevronDown size={14} className="text-[#828EA1]" />
            </button>
          </div>
        </header>

        <main className="flex flex-1 justify-center px-6 pb-16 pt-6">
          <div className="w-full max-w-[600px]">
            <div className="mb-10">
              <h1 className="text-[28px] font-semibold leading-tight text-black">
                Login
              </h1>
              <p className="mt-2 text-base font-medium text-[#8D949D]">
                Login to your Bybelt account to access your Bybelt Inbox.
              </p>
            </div>

            <form className="flex flex-col" onSubmit={handleSubmit}>
              <label className="mb-5 block">
                <span className="mb-1.5 flex text-[15px] font-bold text-[#606976]">
                  Sign in with your email address{" "}
                  <span className="text-[#E11900]">*</span>
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

              <label className="mb-5 block">
                <span className="mb-1.5 flex text-[15px] font-bold text-[#606976]">
                  Password <span className="text-[#E11900]">*</span>
                </span>
                <span className="flex h-11 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password…"
                    className="w-full bg-transparent text-[15px] text-[#1c293b] outline-none placeholder:text-[#828ea1]"
                  />
                </span>
              </label>

              <label className="mb-5 flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-[#E8EAEB] accent-[#1972F5]"
                />
                <span className="text-[15px] font-bold text-[#606976]">
                  Remember me
                </span>
              </label>

              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-[#E8EAEB]" />
                <span className="text-sm font-semibold text-[#828EA1]">or</span>
                <span className="h-px flex-1 bg-[#E8EAEB]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={!googleEnabled || submitting}
                title={
                  googleEnabled
                    ? "Sign in with Google"
                    : "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google sign-in"
                }
                aria-label="Sign in with Google"
                className={cn(
                  "mb-5 flex h-12 w-full items-center justify-center gap-3 rounded border border-[#E8EAEB] bg-white text-[15px] font-semibold text-[#333E4F] transition-colors",
                  googleEnabled && !submitting
                    ? "hover:bg-[#F8F9F9]"
                    : "cursor-not-allowed opacity-60",
                )}
              >
                <GoogleMark />
                Sign in with Google
              </button>

              {error ? (
                <p className="mb-4 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "h-12 w-full rounded border border-black/10 text-[15px] font-semibold text-white transition-colors",
                  canSubmit
                    ? "bg-[#1972F5]"
                    : "cursor-not-allowed bg-[#1972F5]/40",
                )}
              >
                {submitting ? "Signing in…" : "Sign in to Dashboard"}
              </button>

              <div className="mt-9 flex items-center justify-between text-sm">
                <a
                  href={marketingSignupUrl()}
                  className="font-semibold text-[#333E4F] underline"
                >
                  Don&apos;t have an account yet? Get started.
                </a>
                <Link href={APP_AUTH_FORGOT_PATH} className="font-normal text-[#75869C]">
                  Forgot Password?
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>

      <aside className="relative hidden w-[460px] shrink-0 bg-[#4091E7] lg:flex lg:flex-col">
        <div className="flex flex-1 flex-col px-10 pt-16 text-white">
          <h2
            key={`title-${featureIndex}`}
            className="text-2xl font-bold leading-snug transition-opacity duration-500"
          >
            {feature.title}
          </h2>
          <p
            key={`desc-${featureIndex}`}
            className="mt-3 max-w-[340px] text-base leading-6 text-white/90 transition-opacity duration-500"
          >
            {feature.description}
          </p>
          <a
            href={feature.learnMoreHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-block text-sm font-bold text-white underline-offset-2 hover:underline"
          >
            Learn More
          </a>
        </div>
        <div
          key={`image-${featureIndex}`}
          className={cn(
            "mx-auto mb-10 bg-contain bg-center bg-no-repeat transition-opacity duration-500",
            feature.imageClassName,
          )}
          style={{ backgroundImage: `url("${feature.image}")` }}
          role="img"
          aria-label={feature.title}
        />
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
          {LOGIN_FEATURES.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-label={`Show ${item.title}`}
              onClick={() => setFeatureIndex(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                index === featureIndex ? "bg-white" : "bg-white/40 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.61Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
