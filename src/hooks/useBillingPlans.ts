"use client";

import { useCallback, useEffect, useState } from "react";
import type { BillingPlansPayload } from "@/types/billing";

const emptyPayload: BillingPlansPayload = {
  monthlyTotalCents: 0,
  hasPaymentMethod: false,
  plans: [],
};

export function useBillingPlans(enabled: boolean) {
  const [data, setData] = useState<BillingPlansPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/billing/plans");
    if (!response.ok) {
      throw new Error("Failed to load billing plans");
    }
    return (await response.json()) as BillingPlansPayload;
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
          setError("Unable to load billing plans.");
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

  return { ...data, loading, error, refresh: load };
}
