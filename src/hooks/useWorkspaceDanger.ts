"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_INBOX_PATH } from "@/lib/marketing-paths";
import { useSession } from "@/components/providers/SessionProvider";
import type { WorkspaceDangerStatus } from "@/types/workspace-danger";

const emptyStatus: WorkspaceDangerStatus = {
  canLeave: false,
  canDelete: false,
  leaveBlockedReason: null,
  deleteBlockedReason: null,
  isOwner: false,
  workspaceCount: 0,
};

export function useWorkspaceDanger(enabled: boolean) {
  const router = useRouter();
  const { refresh } = useSession();
  const [status, setStatus] = useState<WorkspaceDangerStatus>(emptyStatus);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/workspaces/danger");
    if (!response.ok) {
      throw new Error("Failed to load danger zone status");
    }
    return (await response.json()) as WorkspaceDangerStatus;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus(emptyStatus);
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
          setStatus(payload);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load danger zone settings.");
          setStatus(emptyStatus);
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

  const leaveWorkspace = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/workspaces/leave", {
        method: "POST",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to leave workspace");
      }

      await refresh();
      router.push(APP_INBOX_PATH);
      router.refresh();
      return true;
    } catch (leaveError) {
      setError(
        leaveError instanceof Error ? leaveError.message : "Unable to leave workspace.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh, router]);

  const deleteWorkspace = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/workspaces", {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to delete workspace");
      }

      await refresh();
      router.push(APP_INBOX_PATH);
      router.refresh();
      return true;
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete workspace.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh, router]);

  return {
    ...status,
    loading,
    error,
    saving,
    leaveWorkspace,
    deleteWorkspace,
  };
}
