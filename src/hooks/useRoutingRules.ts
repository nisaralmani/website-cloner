"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoutingRule } from "@/types/routing-rules";

type RoutingRulesPayload = {
  rules: RoutingRule[];
  activeCount: number;
};

const emptyPayload: RoutingRulesPayload = {
  rules: [],
  activeCount: 0,
};

export function useRoutingRules(enabled: boolean) {
  const [data, setData] = useState<RoutingRulesPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/routing-rules");
    if (!response.ok) {
      throw new Error("Failed to load routing rules");
    }
    return (await response.json()) as RoutingRulesPayload;
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
          setError("Unable to load routing rules.");
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

  const createRule = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/routing-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create routing rule");
      }

      await refresh();
      return true;
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create routing rule.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const deleteRule = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/routing-rules/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete routing rule");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to delete routing rule.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const toggleRule = useCallback(
    async (id: string, enabled: boolean) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/routing-rules/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        if (!response.ok) {
          throw new Error("Failed to update routing rule");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to update routing rule.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  return {
    rules: data.rules,
    activeCount: data.activeCount,
    loading,
    error,
    saving,
    createRule,
    deleteRule,
    toggleRule,
    refresh,
  };
}
