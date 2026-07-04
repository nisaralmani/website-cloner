"use client";

import { useCallback, useEffect, useState } from "react";
import type { SearchAiFrequentSearch } from "@/types/search-ai";

type FrequentSearchesPayload = {
  searches: SearchAiFrequentSearch[];
  overlayInstalled: boolean;
};

const emptyPayload: FrequentSearchesPayload = {
  searches: [],
  overlayInstalled: false,
};

export function useSearchAiFrequentSearches(enabled: boolean) {
  const [data, setData] = useState<FrequentSearchesPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/search-ai/frequent-searches");
    if (!response.ok) {
      throw new Error("Failed to load frequent searches");
    }
    return (await response.json()) as FrequentSearchesPayload;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setData(emptyPayload);
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
          setData(payload);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load frequent searches.");
          setData(emptyPayload);
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

  const refresh = useCallback(async () => {
    const payload = await load();
    setData(payload);
    return payload;
  }, [load]);

  const createSearch = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/search-ai/frequent-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create frequent search");
      }

      await refresh();
      return true;
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create frequent search.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const deleteSearch = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/search-ai/frequent-searches/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete frequent search");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to delete frequent search.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  return {
    searches: data.searches,
    overlayInstalled: data.overlayInstalled,
    loading,
    error,
    saving,
    createSearch,
    deleteSearch,
    refresh,
  };
}
