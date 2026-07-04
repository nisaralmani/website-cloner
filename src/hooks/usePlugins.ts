"use client";

import { useCallback, useEffect, useState } from "react";
import type { Plugin, PluginCategory } from "@/types/plugins";
import type { PluginFilter } from "@/lib/plugins-routes";

export function usePlugins(filter: PluginFilter, category: string | null, searchQuery = "") {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [categories, setCategories] = useState<PluginCategory[]>([]);
  const [installedCount, setInstalledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter === "installed") params.set("filter", "installed");
      if (category) params.set("category", category);
      const query = searchQuery.trim();
      if (query) params.set("q", query);

      const response = await fetch(
        `/api/plugins${params.size > 0 ? `?${params.toString()}` : ""}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load plugins");
      }
      const data = (await response.json()) as {
        plugins: Plugin[];
        categories: PluginCategory[];
        installedCount: number;
      };
      setPlugins(data.plugins);
      setCategories(data.categories);
      setInstalledCount(data.installedCount);
    } catch {
      setError("Unable to load plugins.");
      setPlugins([]);
      setCategories([]);
      setInstalledCount(0);
    } finally {
      setLoading(false);
    }
  }, [category, filter, searchQuery]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleInstall = useCallback(
    async (pluginId: string, installed: boolean) => {
      const response = await fetch(`/api/plugins/${pluginId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installed }),
      });
      if (!response.ok) {
        throw new Error("Failed to update plugin");
      }
      await reload();
    },
    [reload],
  );

  return { plugins, categories, installedCount, loading, error, reload, toggleInstall };
}
