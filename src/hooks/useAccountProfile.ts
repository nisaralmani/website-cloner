"use client";

import { useCallback, useEffect, useState } from "react";
import type { AccountProfile, ProfileFieldKey } from "@/lib/auth/profile";
import { combineDisplayName } from "@/lib/auth/profile";
import { useSession } from "@/components/providers/SessionProvider";

export function useAccountProfile(enabled: boolean) {
  const { refresh: refreshSession } = useSession();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<ProfileFieldKey | "avatar" | null>(null);
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

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
        const response = await fetch("/api/auth/profile");
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }
        const data = (await response.json()) as { profile: AccountProfile };
        if (!cancelled) {
          setProfile(data.profile);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load account profile.");
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
    async (field: ProfileFieldKey, value: string) => {
      if (!profile) return false;

      const previous = profile;
      const optimistic: AccountProfile = {
        ...profile,
        [field]: value,
        name:
          field === "firstName" || field === "lastName"
            ? combineDisplayName(
                field === "firstName" ? value : profile.firstName,
                field === "lastName" ? value : profile.lastName,
              )
            : profile.name,
      };

      setProfile(optimistic);
      setSaving(field);
      setError(null);

      try {
        const response = await fetch("/api/auth/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        if (!response.ok) {
          throw new Error("Failed to save profile");
        }

        const data = (await response.json()) as { profile: AccountProfile };
        setProfile(data.profile);
        await refreshSession();
        return true;
      } catch {
        setProfile(previous);
        setError("Unable to save profile.");
        return false;
      } finally {
        setSaving(null);
      }
    },
    [profile, refreshSession],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!profile) return false;

      setSaving("avatar");
      setError(null);

      try {
        const formData = new FormData();
        formData.set("avatar", file);

        const response = await fetch("/api/auth/avatar", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Failed to upload avatar");
        }

        const data = (await response.json()) as { profile: AccountProfile };
        setProfile(data.profile);
        await refreshSession();
        return true;
      } catch {
        setError("Unable to upload avatar.");
        return false;
      } finally {
        setSaving(null);
      }
    },
    [profile, refreshSession],
  );

  const removeAvatar = useCallback(async () => {
    if (!profile) return false;

    setSaving("avatar");
    setError(null);

    try {
      const response = await fetch("/api/auth/avatar", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to remove avatar");
      }

      const data = (await response.json()) as { profile: AccountProfile };
      setProfile(data.profile);
      await refreshSession();
      return true;
    } catch {
      setError("Unable to remove avatar.");
      return false;
    } finally {
      setSaving(null);
    }
  }, [profile, refreshSession]);

  const requestEmailVerification = useCallback(async () => {
    setVerificationSending(true);
    setVerificationMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-email/request", { method: "POST" });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send verification email");
      }

      setVerificationMessage(data.message ?? "Verification email sent.");
      return true;
    } catch {
      setError("Unable to send verification email.");
      return false;
    } finally {
      setVerificationSending(false);
    }
  }, []);

  return {
    profile,
    loading,
    error,
    saving,
    verificationSending,
    verificationMessage,
    updateField,
    uploadAvatar,
    removeAvatar,
    requestEmailVerification,
  };
}
