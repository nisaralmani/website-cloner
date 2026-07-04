"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { editLimitIncrement } from "@/lib/workspaces/workspace-data";
import type {
  WorkspaceDataLimit,
  WorkspaceDataLimitKey,
  WorkspaceDataPayload,
} from "@/types/workspace-data";

const emptyPayload: WorkspaceDataPayload = {
  training: {
    magicReplyNeverTrained: true,
    magicReplyLastTrainedAt: null,
    knowledgeBaseEnabled: false,
    helpdeskArticleCount: 0,
    knowledgeBaseDescription:
      "You do not have a Bybelt Knowledge Base. Did you know that articles that you write there are also used as training data for MagicReply and Copilot?",
  },
  limits: [],
  contract: {
    label: "GDPR Data Processing Agreement",
    signed: false,
    signedAt: null,
    viewHref: "/documents/gdpr_dpa_contract.pdf",
  },
};

export function useWorkspaceData(enabled: boolean) {
  const [data, setData] = useState<WorkspaceDataPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/workspaces/data");
    if (!response.ok) {
      throw new Error("Failed to load workspace data settings");
    }
    return (await response.json()) as WorkspaceDataPayload;
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
          setError("Unable to load workspace data settings.");
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

  const limitsByLabel = useMemo(() => {
    const map: Record<string, WorkspaceDataLimit> = {};
    for (const limit of data.limits) {
      map[limit.label] = limit;
    }
    return map;
  }, [data.limits]);

  const startMagicReplyTraining = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/workspaces/data/training", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to start MagicReply training");
      }

      await refresh();
      return true;
    } catch {
      setError("Unable to start MagicReply training.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const updateLimit = useCallback(
    async (key: WorkspaceDataLimitKey, limit: number) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/workspaces/data/limits", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, limit }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to update limit");
        }

        await refresh();
        return true;
      } catch (updateError) {
        setError(
          updateError instanceof Error ? updateError.message : "Unable to update limit.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const editLimit = useCallback(
    async (key: WorkspaceDataLimitKey) => {
      const current = data.limits.find((limit) => limit.key === key);
      if (!current) {
        return false;
      }

      return updateLimit(key, editLimitIncrement(key, current.limit));
    },
    [data.limits, updateLimit],
  );

  const signContract = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/workspaces/data/contract", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to upload contract");
      }

      await refresh();
      return true;
    } catch {
      setError("Unable to upload signed contract.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  return {
    ...data,
    limitsByLabel,
    loading,
    error,
    saving,
    startMagicReplyTraining,
    updateLimit,
    editLimit,
    signContract,
  };
}
