"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CampaignTemplate } from "@/types/campaigns";

export function useCampaignTemplates(category: "all" | "bybelt" | "yours") {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/campaigns/templates");
      if (!response.ok) {
        throw new Error("Failed to load templates");
      }
      const data = (await response.json()) as { templates: CampaignTemplate[] };
      setTemplates(data.templates);
    } catch {
      setError("Unable to load templates.");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    if (category === "all") return templates;
    return templates.filter((template) => template.category === category);
  }, [category, templates]);

  return { templates: filtered, loading, error, reload };
}
