"use client";

import { useCallback, useEffect, useState } from "react";
import type { BillingCardsPayload } from "@/types/billing";

const emptyPayload: BillingCardsPayload = {
  cards: [],
};

export function useBillingCards(enabled: boolean) {
  const [data, setData] = useState<BillingCardsPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/billing/cards");
    if (!response.ok) {
      throw new Error("Failed to load payment methods");
    }
    return (await response.json()) as BillingCardsPayload;
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
          setError("Unable to load payment methods.");
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

  const refresh = useCallback(async () => {
    const payload = await load();
    setData(payload);
    return payload;
  }, [load]);

  const addCard = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to add payment method");
      }

      await refresh();
      return true;
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Unable to add payment method.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const removeCard = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/billing/cards/${id}`, { method: "DELETE" });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to remove payment method");
        }

        await refresh();
        return true;
      } catch (removeError) {
        setError(
          removeError instanceof Error ? removeError.message : "Unable to remove payment method.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  return {
    ...data,
    loading,
    error,
    saving,
    addCard,
    removeCard,
    refresh,
  };
}
