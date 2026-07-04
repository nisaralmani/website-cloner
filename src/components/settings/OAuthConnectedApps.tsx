"use client";

import { useOAuthProviders } from "@/hooks/useOAuthProviders";

export function OAuthConnectedApps() {
  const { providers, loading, error, unlinking, password, setPassword, unlinkGoogle } =
    useOAuthProviders(true);

  if (loading) {
    return (
      <p className="mb-6 text-sm text-[#828EA1]">Loading connected apps…</p>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold text-[#2C405A]">Connected apps</h2>
      <p className="mt-1 text-sm text-[#75869C]">
        Manage third-party apps linked to your account.
      </p>

      <div className="mt-4 rounded-lg border border-[#E8EAEB] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1C293B]">Google</p>
            <p className="text-xs text-[#75869C]">
              {providers?.googleLinked
                ? "Linked to your account"
                : providers?.google
                  ? "Available — not linked"
                  : "Not configured on this server"}
            </p>
          </div>
          {providers?.googleLinked ? (
            <span className="rounded bg-[#F2F8F2] px-2 py-0.5 text-xs font-semibold text-[#5DAC5D]">
              Linked
            </span>
          ) : (
            <span className="rounded bg-[#F4F4F5] px-2 py-0.5 text-xs font-semibold text-[#5D6B98]">
              Not linked
            </span>
          )}
        </div>

        {providers?.googleLinked ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-xs font-semibold text-[#75869C]">
                Confirm with password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your account password"
                className="h-10 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm text-[#1C293B] outline-none"
              />
            </label>
            <button
              type="button"
              disabled={unlinking}
              onClick={() => void unlinkGoogle()}
              className="h-10 shrink-0 rounded border border-[#E8EAEB] px-4 text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB] disabled:opacity-60"
            >
              {unlinking ? "Unlinking…" : "Unlink Google"}
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-[#E07415]">{error}</p> : null}
    </section>
  );
}
