"use client";

import { useCallback, useEffect, useState } from "react";
import { VISITOR_POLL_INTERVAL_MS } from "@/lib/visitors/constants";
import type { Visitor, VisitorStats } from "@/types/visitors";

const EMPTY_STATS: VisitorStats = { online: 0, active: 0 };

export function useVisitors(searchQuery = "") {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      const query = searchQuery.trim();
      if (query) params.set("q", query);

      const response = await fetch(
        `/api/visitors${params.size > 0 ? `?${params.toString()}` : ""}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load visitors");
      }
      const data = (await response.json()) as {
        visitors: Visitor[];
        stats: VisitorStats;
      };
      setVisitors(data.visitors);
      setStats(data.stats);
    } catch {
      setError("Unable to load visitors.");
      setVisitors([]);
      setStats(EMPTY_STATS);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [searchQuery]);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => {
      void reload({ silent: true });
    }, VISITOR_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  return { visitors, stats, loading, error, reload };
}

export function useVisitorCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/visitors");
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { stats?: VisitorStats };
        if (!cancelled && data.stats) setCount(data.stats.online);
      } catch {
        if (!cancelled) setCount(0);
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, VISITOR_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return count;
}
