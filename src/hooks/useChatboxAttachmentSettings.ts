"use client";

import { useCallback, useEffect, useState } from "react";

const emptyState = { maxBytes: 5 * 1024 * 1024 };

export function useChatboxAttachmentSettings(enabled: boolean) {
  const [maxBytes, setMaxBytes] = useState(emptyState.maxBytes);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/settings/chatbox/attachments");
    if (!response.ok) {
      throw new Error("Failed to load attachment settings");
    }
    const data = (await response.json()) as { maxBytes: number };
    return data.maxBytes;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setMaxBytes(emptyState.maxBytes);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const value = await load();
        if (!cancelled) setMaxBytes(value);
      } catch {
        if (!cancelled) {
          setError("Unable to load attachment settings.");
          setMaxBytes(emptyState.maxBytes);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, load]);

  const save = useCallback(async (nextMaxBytes: number) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/chatbox/attachments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxBytes: nextMaxBytes }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save attachment settings");
      }
      const data = (await response.json()) as { maxBytes: number };
      setMaxBytes(data.maxBytes);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save attachment settings.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { maxBytes, loading, error, saving, save };
}
