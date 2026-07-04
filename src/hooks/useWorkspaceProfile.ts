"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkspaceProfile, WorkspaceProfileFieldKey } from "@/lib/workspaces/profile-fields";
import { workspaceInitials } from "@/lib/workspaces/utils";
import { useSession } from "@/components/providers/SessionProvider";

export function useWorkspaceProfile(enabled: boolean) {
  const { refresh: refreshSession } = useSession();
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<WorkspaceProfileFieldKey | "logo" | null>(null);

  useEffect(() => {
    if (!enabled) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch("/api/workspaces/profile");
        if (!response.ok) {
          throw new Error("Failed to load workspace profile");
        }
        const data = (await response.json()) as { profile: WorkspaceProfile };
        if (!cancelled) {
          setProfile(data.profile);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load workspace information.");
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
  }, [enabled]);

  const updateField = useCallback(
    async (field: WorkspaceProfileFieldKey, value: string) => {
      if (!profile) return false;

      const previous = profile;
      const optimistic: WorkspaceProfile = {
        ...profile,
        [field]: value,
        initials: field === "name" ? workspaceInitials(value) : profile.initials,
      };

      setProfile(optimistic);
      setSaving(field);
      setError(null);

      try {
        const response = await fetch("/api/workspaces/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        if (!response.ok) {
          throw new Error("Failed to save workspace profile");
        }

        const data = (await response.json()) as { profile: WorkspaceProfile };
        setProfile(data.profile);
        await refreshSession();
        return true;
      } catch {
        setProfile(previous);
        setError("Unable to save workspace information.");
        return false;
      } finally {
        setSaving(null);
      }
    },
    [profile, refreshSession],
  );

  const uploadLogo = useCallback(
    async (file: File) => {
      if (!profile) return false;

      setSaving("logo");
      setError(null);

      try {
        const formData = new FormData();
        formData.set("logo", file);

        const response = await fetch("/api/workspaces/logo", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Failed to upload logo");
        }

        const data = (await response.json()) as { profile: WorkspaceProfile };
        setProfile(data.profile);
        await refreshSession();
        return true;
      } catch {
        setError("Unable to upload workspace logo.");
        return false;
      } finally {
        setSaving(null);
      }
    },
    [profile, refreshSession],
  );

  const removeLogo = useCallback(async () => {
    if (!profile) return false;

    setSaving("logo");
    setError(null);

    try {
      const response = await fetch("/api/workspaces/logo", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to remove logo");
      }

      const data = (await response.json()) as { profile: WorkspaceProfile };
      setProfile(data.profile);
      await refreshSession();
      return true;
    } catch {
      setError("Unable to remove workspace logo.");
      return false;
    } finally {
      setSaving(null);
    }
  }, [profile, refreshSession]);

  return { profile, loading, error, saving, updateField, uploadLogo, removeLogo };
}
