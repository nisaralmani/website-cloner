"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TRIAGE_ACTION_FILTER_ALL } from "@/lib/triage/validation";
import type { TriageRulesPayload, TriageRuleset } from "@/types/triage";

const emptyPayload: TriageRulesPayload = {
  rules: [],
  blockRules: [],
  sortRules: [],
  blockActiveCount: 0,
  sortActiveCount: 0,
};

export function useTriageRules(enabled: boolean) {
  const [data, setData] = useState<TriageRulesPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState(TRIAGE_ACTION_FILTER_ALL);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedSearchQuery.trim()) {
      params.set("q", debouncedSearchQuery.trim());
    }
    if (actionFilter !== TRIAGE_ACTION_FILTER_ALL) {
      params.set("action", actionFilter);
    }

    const query = params.toString();
    const response = await fetch(`/api/triage-rules${query ? `?${query}` : ""}`);
    if (!response.ok) {
      throw new Error("Failed to load triage rules");
    }

    return (await response.json()) as TriageRulesPayload;
  }, [actionFilter, debouncedSearchQuery]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

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
          setError("Unable to load triage rules.");
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

  const createRule = useCallback(
    async (ruleset: TriageRuleset) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/triage-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ruleset }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to create triage rule");
        }

        await refresh();
        return true;
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : "Unable to create triage rule.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const deleteRule = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/triage-rules/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete triage rule");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to delete triage rule.");
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
        const response = await fetch(`/api/triage-rules/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        if (!response.ok) {
          throw new Error("Failed to update triage rule");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to update triage rule.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const rulesForRuleset = useMemo(
    () => ({
      block: data.blockRules,
      sort: data.sortRules,
    }),
    [data.blockRules, data.sortRules],
  );

  const activeCountForRuleset = useMemo(
    () => ({
      block: data.blockActiveCount,
      sort: data.sortActiveCount,
    }),
    [data.blockActiveCount, data.sortActiveCount],
  );

  return {
    rules: data.rules,
    rulesForRuleset,
    activeCountForRuleset,
    loading,
    error,
    saving,
    searchQuery,
    setSearchQuery,
    actionFilter,
    setActionFilter,
    createRule,
    deleteRule,
    toggleRule,
    refresh,
  };
}
