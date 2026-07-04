"use client";

import { useEffect } from "react";
import { useSession } from "@/components/providers/SessionProvider";

async function syncAppActivity(active: boolean) {
  try {
    const response = await fetch("/api/auth/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
      keepalive: active ? undefined : true,
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      user?: {
        presence?: "online" | "offline";
        autoAvailable?: boolean;
        forceOffline?: boolean;
      };
    };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function useAppPresence() {
  const { authenticated, user, refresh } = useSession();

  useEffect(() => {
    if (!authenticated || !user?.autoAvailable || user.forceOffline) {
      return;
    }

    let cancelled = false;

    const applyActivity = async (active: boolean) => {
      const nextUser = await syncAppActivity(active);
      if (cancelled || !nextUser) return;
      await refresh();
    };

    const handleVisibility = () => {
      void applyActivity(document.visibilityState === "visible");
    };

    void applyActivity(true);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      void syncAppActivity(false);
    };
  }, [authenticated, refresh, user?.autoAvailable, user?.forceOffline]);
}

export function AppPresenceTracker() {
  useAppPresence();
  return null;
}
