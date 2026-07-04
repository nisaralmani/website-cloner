"use client";

import { useEffect, useState } from "react";
import type { SearchResponse } from "@/types/search";

const EMPTY_RESULTS: SearchResponse = {
  query: "",
  conversations: [],
  contacts: [],
  plugins: [],
  settings: [],
  navigation: [],
  campaigns: [],
  helpdesk: [],
  visitors: [],
  messageShortcuts: [],
};

export function useGlobalSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<SearchResponse>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const trimmed = query.trim();
      if (trimmed) params.set("q", trimmed);

      void fetch(`/api/search${params.size > 0 ? `?${params.toString()}` : ""}`)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to search");
          return response.json() as Promise<SearchResponse>;
        })
        .then((data) => {
          if (!cancelled) setResults(data);
        })
        .catch(() => {
          if (!cancelled) {
            setError("Unable to search.");
            setResults(EMPTY_RESULTS);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, query]);

  return { results, loading, error };
}
