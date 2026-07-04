"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsOverview } from "@/types/analytics";

const EMPTY_OVERVIEW: AnalyticsOverview = {
  analyticsEnabled: false,
  timezone: "UTC",
  periodLabel: "Since a week — Last 7 days",
  kpis: { conversations: 0, visitors: 0, rating: 0 },
  hasChartData: false,
};

export function useAnalytics(days = 7) {
  const [data, setData] = useState<AnalyticsOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics?days=${days}`);
      if (!response.ok) {
        throw new Error("Failed to load analytics");
      }
      const payload = (await response.json()) as AnalyticsOverview;
      setData(payload);
    } catch {
      setError("Unable to load analytics.");
      setData(EMPTY_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
