"use client";

import { useCallback, useEffect, useState } from "react";
import type { Campaign, CampaignCounts } from "@/types/campaigns";
import { campaignsTypeFromPath } from "@/lib/campaigns-routes";

const EMPTY_COUNTS: CampaignCounts = {
  templatesAll: 0,
  templatesBybelt: 0,
  templatesYours: 0,
};

export function useCampaigns(pathname: string, searchQuery = "", tagFilter = "") {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [counts, setCounts] = useState<CampaignCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const type = campaignsTypeFromPath(pathname);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type });
      const query = searchQuery.trim();
      if (query) params.set("q", query);
      const tag = tagFilter.trim();
      if (tag) params.set("tag", tag);

      const response = await fetch(`/api/campaigns?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load campaigns");
      }
      const data = (await response.json()) as {
        campaigns: Campaign[];
        counts: CampaignCounts;
      };
      setCampaigns(data.campaigns);
      setCounts(data.counts);
    } catch {
      setError("Unable to load campaigns.");
      setCampaigns([]);
      setCounts(EMPTY_COUNTS);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, tagFilter, type]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { campaigns, counts, loading, error, reload };
}

export function useCampaignCounts() {
  const [counts, setCounts] = useState<CampaignCounts>(EMPTY_COUNTS);

  useEffect(() => {
    void fetch("/api/campaigns")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { counts?: CampaignCounts } | null) => {
        if (data?.counts) setCounts(data.counts);
      })
      .catch(() => setCounts(EMPTY_COUNTS));
  }, []);

  return counts;
}
