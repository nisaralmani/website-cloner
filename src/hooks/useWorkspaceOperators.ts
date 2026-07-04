"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkspaceOperatorsPayload } from "@/types/workspace-operators";

const emptyPayload: WorkspaceOperatorsPayload = {
  operators: [],
  supportOnline: false,
};

export function useWorkspaceOperators(enabled: boolean) {
  const [data, setData] = useState<WorkspaceOperatorsPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/workspaces/operators");
    if (!response.ok) {
      throw new Error("Failed to load workspace operators");
    }
    return (await response.json()) as WorkspaceOperatorsPayload;
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
          setError("Unable to load workspace operators.");
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

  const inviteOperator = useCallback(
    async (email: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/workspaces/operators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to invite operator");
        }

        await refresh();
        return true;
      } catch (inviteError) {
        setError(
          inviteError instanceof Error ? inviteError.message : "Unable to invite operator.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const removeOperator = useCallback(
    async (userId: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/workspaces/operators/${userId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to remove operator");
        }

        await refresh();
        return true;
      } catch (removeError) {
        setError(
          removeError instanceof Error ? removeError.message : "Unable to remove operator.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const updateOperatorRole = useCallback(
    async (userId: string, role: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/workspaces/operators/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to update operator role");
        }

        await refresh();
        return true;
      } catch (updateError) {
        setError(
          updateError instanceof Error ? updateError.message : "Unable to update operator role.",
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
    inviteOperator,
    removeOperator,
    updateOperatorRole,
    refresh,
  };
}
