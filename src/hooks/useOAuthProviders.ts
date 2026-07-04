"use client";

import { useCallback, useEffect, useState } from "react";

type ProvidersPayload = {
  google: boolean;
  googleLinked: boolean;
};

export function useOAuthProviders(enabled: boolean) {
  const [providers, setProviders] = useState<ProvidersPayload | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);
  const [password, setPassword] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/auth/providers");
    if (!response.ok) {
      throw new Error("Failed to load auth providers");
    }
    return (await response.json()) as ProvidersPayload;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setProviders(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const payload = await load();
        if (!cancelled) {
          setProviders(payload);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load connected apps.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, load]);

  const unlinkGoogle = useCallback(async () => {
    if (!password.trim()) {
      setError("Enter your password to unlink Google.");
      return false;
    }

    setUnlinking(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/providers/google", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.status === 404) {
        setProviders((current) =>
          current ? { ...current, googleLinked: false } : current,
        );
        setPassword("");
        return true;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to unlink Google account");
      }

      setProviders((current) => (current ? { ...current, googleLinked: false } : current));
      setPassword("");
      return true;
    } catch (unlinkError) {
      setError(
        unlinkError instanceof Error ? unlinkError.message : "Unable to unlink Google account.",
      );
      return false;
    } finally {
      setUnlinking(false);
    }
  }, [password]);

  return {
    providers,
    loading,
    error,
    unlinking,
    password,
    setPassword,
    unlinkGoogle,
  };
}
