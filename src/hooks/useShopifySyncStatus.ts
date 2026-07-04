"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShopifyWorkspaceLinkStatus } from "@/types/shopify";

export function useShopifySyncStatus() {
  const [status, setStatus] = useState<ShopifyWorkspaceLinkStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/integrations/shopify/status", { cache: "no-store" });
      if (!response.ok) {
        setStatus(null);
        return;
      }
      const payload = (await response.json()) as ShopifyWorkspaceLinkStatus & {
        available?: boolean;
      };
      setStatus(payload);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const lastSyncLabel =
    status?.lastContactSyncAt != null
      ? new Date(status.lastContactSyncAt).toLocaleString()
      : null;

  return { status, loading, lastSyncLabel, reload };
}
