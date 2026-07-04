"use client";

import { useCallback, useState } from "react";
import { useSession } from "@/components/providers/SessionProvider";

export type UpgradePlanTag = "Essentials" | "Plus";

export function useUpgradePlan() {
  const { workspace, refresh } = useSession();
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrade = useCallback(
    async (planTag: UpgradePlanTag) => {
      if (!workspace?.id) {
        setError("No active workspace.");
        return false;
      }

      setUpgrading(true);
      setError(null);
      try {
        const response = await fetch("/api/billing/plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: workspace.id,
            planTag,
          }),
        });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to upgrade plan");
        }
        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upgrade plan.");
        return false;
      } finally {
        setUpgrading(false);
      }
    },
    [refresh, workspace?.id],
  );

  return { upgrade, upgrading, error };
}
