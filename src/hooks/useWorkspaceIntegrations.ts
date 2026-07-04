"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkspaceIntegrationsPayload } from "@/types/workspace-integrations";

const emptyPayload: WorkspaceIntegrationsPayload = {
  workspaceId: "",
  intro: "",
  footerButton: "",
  categories: [],
  htmlSnippet: "",
  scriptUrl: "",
};

export function useWorkspaceIntegrations(enabled: boolean) {
  const [data, setData] = useState<WorkspaceIntegrationsPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/workspaces/integrations");
    if (!response.ok) {
      throw new Error("Failed to load workspace integrations");
    }
    return (await response.json()) as WorkspaceIntegrationsPayload;
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
          setError("Unable to load workspace integrations.");
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
