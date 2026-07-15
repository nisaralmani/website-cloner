"use client";

import { useCallback, useState } from "react";
import { useSession } from "@/components/providers/SessionProvider";

/**
 * Billing lives in the Shopify admin app (Shopify is the billing source of truth).
 * Upgrading no longer mutates state here — it resolves the merchant's Shopify
 * "manage billing" URL and redirects there. Workspaces with no linked Shopify
 * store are blocked with a clear message.
 */
export function useUpgradePlan() {
  const { workspace } = useSession();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openBilling = useCallback(async () => {
    if (!workspace?.id) {
      setError("No active workspace.");
      return false;
    }

    setOpening(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json()) as { manageUrl?: string; error?: string };
      if (!response.ok || !data.manageUrl) {
        throw new Error(data.error ?? "Could not open billing.");
      }
      window.location.href = data.manageUrl;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open billing.");
      return false;
    } finally {
      setOpening(false);
    }
  }, [workspace?.id]);

  return { openBilling, opening, error };
}
