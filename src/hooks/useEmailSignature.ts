"use client";

import { useCallback, useEffect, useState } from "react";

type EmailSignatureState = {
  enabled: boolean;
  text: string;
};

const emptyState: EmailSignatureState = {
  enabled: false,
  text: "",
};

export function useEmailSignature(enabled: boolean) {
  const [data, setData] = useState<EmailSignatureState>(emptyState);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/settings/email/signature");
    if (!response.ok) {
      throw new Error("Failed to load email signature");
    }
    return (await response.json()) as EmailSignatureState;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setData(emptyState);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const payload = await load();
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) {
          setError("Unable to load email signature.");
          setData(emptyState);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, load]);

  const save = useCallback(async (next: EmailSignatureState) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/email/signature", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) {
        throw new Error("Failed to save email signature");
      }
      const saved = (await response.json()) as EmailSignatureState;
      setData(saved);
      return true;
    } catch {
      setError("Unable to save email signature.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { ...data, loading, error, saving, save };
}
