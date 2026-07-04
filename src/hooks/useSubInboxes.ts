"use client";

import { useCallback, useEffect, useState } from "react";
import type { SubInbox } from "@/types/sub-inboxes";

type SubInboxesPayload = {
  subInboxes: SubInbox[];
  activeCount: number;
};

const emptyPayload: SubInboxesPayload = {
  subInboxes: [],
  activeCount: 0,
};

export function useSubInboxes(enabled: boolean) {
  const [data, setData] = useState<SubInboxesPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/sub-inboxes");
    if (!response.ok) {
      throw new Error("Failed to load sub-inboxes");
    }
    return (await response.json()) as SubInboxesPayload;
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
          setError("Unable to load sub-inboxes.");
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

  const createSubInbox = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/sub-inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create sub-inbox");
      }

      await refresh();
      return true;
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create sub-inbox.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const deleteSubInbox = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/sub-inboxes/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete sub-inbox");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to delete sub-inbox.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const toggleSubInbox = useCallback(
    async (id: string, enabled: boolean) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/sub-inboxes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        if (!response.ok) {
          throw new Error("Failed to update sub-inbox");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to update sub-inbox.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const updateSubInbox = useCallback(
    async (id: string, patch: { name?: string; segment?: string | null }) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/sub-inboxes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to update sub-inbox");
        }

        await refresh();
        return true;
      } catch (updateError) {
        setError(
          updateError instanceof Error ? updateError.message : "Unable to update sub-inbox.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  return {
    subInboxes: data.subInboxes,
    activeCount: data.activeCount,
    loading,
    error,
    saving,
    createSubInbox,
    deleteSubInbox,
    toggleSubInbox,
    updateSubInbox,
    refresh,
  };
}
