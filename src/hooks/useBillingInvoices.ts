"use client";

import { useCallback, useEffect, useState } from "react";
import type { BillingInvoicesPayload } from "@/types/billing";

const emptyPayload: BillingInvoicesPayload = {
  invoices: [],
};

export function useBillingInvoices(enabled: boolean) {
  const [data, setData] = useState<BillingInvoicesPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/billing/invoices");
    if (!response.ok) {
      throw new Error("Failed to load invoices");
    }
    return (await response.json()) as BillingInvoicesPayload;
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
          setError("Unable to load invoices.");
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

  const createInvoice = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: `INV-${Date.now()}`,
          amountCents: 2900,
          currency: "USD",
          status: "paid",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create invoice");
      }
      const payload = await load();
      setData(payload);
      return true;
    } catch {
      setError("Unable to create invoice.");
      return false;
    } finally {
      setCreating(false);
    }
  }, [load]);

  return { ...data, loading, error, creating, refresh: load, createInvoice };
}
