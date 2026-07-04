"use client";

import { useEffect, useState } from "react";
import type { ShopifyCustomerContextResponse } from "@/types/shopify";

export function useShopifyCustomerContext(email: string | null | undefined) {
  const [data, setData] = useState<ShopifyCustomerContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const normalized = email?.trim();
    if (!normalized) {
      setData(null);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    void (async () => {
      try {
        const params = new URLSearchParams({ email: normalized });
        const response = await fetch(`/api/integrations/shopify/context?${params}`);
        if (!response.ok) {
          throw new Error("unavailable");
        }
        const payload = (await response.json()) as ShopifyCustomerContextResponse;
        if (!cancelled) {
          setData(payload);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setData(null);
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
  }, [email]);

  return { data, loading, error };
}
