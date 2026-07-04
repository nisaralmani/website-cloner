"use client";

import { useCallback, useState } from "react";

export function useShopifyContactSync() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/shopify/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as {
        error?: string;
        created?: number;
        updated?: number;
        total?: number;
        conversationsTagged?: number;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Sync failed");
      }
      const tagged =
        payload.conversationsTagged != null && payload.conversationsTagged > 0
          ? ` · ${payload.conversationsTagged} inbox conversation(s) tagged`
          : "";
      setMessage(
        `Synced ${payload.total ?? 0} customers (${payload.created ?? 0} new, ${payload.updated ?? 0} updated)${tagged}.`,
      );
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed");
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { sync, syncing, message };
}
