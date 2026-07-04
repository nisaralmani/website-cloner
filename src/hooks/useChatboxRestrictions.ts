"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TableRowCell } from "@/lib/settings-data";
import type { ChatboxRestriction, ChatboxRestrictionKind } from "@/types/chatbox-restrictions";

type ChatboxRestrictionsPayload = {
  restrictions: ChatboxRestriction[];
};

const emptyPayload: ChatboxRestrictionsPayload = {
  restrictions: [],
};

export function useChatboxRestrictions(enabled: boolean) {
  const [data, setData] = useState<ChatboxRestrictionsPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/chatbox/restrictions");
    if (!response.ok) {
      throw new Error("Failed to load chatbox restrictions");
    }
    return (await response.json()) as ChatboxRestrictionsPayload;
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
          setError("Unable to load chatbox restrictions.");
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

  const createRestriction = useCallback(
    async (kind: ChatboxRestrictionKind, value?: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/chatbox/restrictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value ? { kind, value } : { kind }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to create restriction");
        }

        await refresh();
        return true;
      } catch (createError) {
        setError(
          createError instanceof Error ? createError.message : "Unable to create restriction.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const deleteRestriction = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/chatbox/restrictions/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete restriction");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to delete restriction.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const clearBlockedVisitors = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/chatbox/restrictions/clear-blocked-visitors", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to clear blocked visitors");
      }

      await refresh();
      return true;
    } catch {
      setError("Unable to clear blocked visitors.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const blockedPageRows = useMemo<TableRowCell[][]>(
    () =>
      data.restrictions
        .filter((restriction) => restriction.kind === "blocked_page")
        .map((restriction) => [
          { kind: "text", value: restriction.value },
          { kind: "deleteIcon", id: restriction.id },
        ]),
    [data.restrictions],
  );

  return {
    restrictions: data.restrictions,
    blockedPageRows,
    loading,
    error,
    saving,
    createRestriction,
    deleteRestriction,
    clearBlockedVisitors,
    refresh,
  };
}
