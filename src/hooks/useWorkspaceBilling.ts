"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkspaceBillingPayload } from "@/types/billing";

const emptyPayload: WorkspaceBillingPayload = {
  paymentMethodId: null,
  cards: [],
  selectedCard: null,
};

export function useWorkspaceBilling(enabled: boolean) {
  const [data, setData] = useState<WorkspaceBillingPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/workspaces/billing");
    if (!response.ok) {
      throw new Error("Failed to load workspace billing");
    }
    return (await response.json()) as WorkspaceBillingPayload;
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
          setError("Unable to load workspace billing.");
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

  const setPaymentMethod = useCallback(
    async (paymentMethodId: string | null) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/workspaces/billing", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethodId }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to update workspace payment method");
        }

        const payload = (await response.json()) as WorkspaceBillingPayload;
        setData(payload);
        return true;
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : "Unable to update workspace payment method.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

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

      const created = (await response.json()) as { card?: { id: string } };
      await refresh();
      if (created.card?.id) {
        await setPaymentMethod(created.card.id);
      }
      return true;
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Unable to add payment method.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh, setPaymentMethod]);

  return {
    ...data,
    loading,
    error,
    saving,
    setPaymentMethod,
    addCard,
    refresh,
  };
}
