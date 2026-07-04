"use client";

import { useEffect } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import {
  applyInterfacePreferences,
  DEFAULT_INTERFACE_PREFERENCES,
  type InterfacePreferences,
} from "@/lib/auth/interface-preferences";

export function InterfacePreferencesApplier() {
  const { authenticated } = useSession();

  useEffect(() => {
    if (!authenticated) {
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.lang = "en";
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/settings/account/interface");
        if (!response.ok) {
          throw new Error("Failed to load interface preferences");
        }

        const data = (await response.json()) as { fields?: InterfacePreferences };
        if (!cancelled) {
          applyInterfacePreferences(data.fields ?? DEFAULT_INTERFACE_PREFERENCES);
        }
      } catch {
        if (!cancelled) {
          applyInterfacePreferences(DEFAULT_INTERFACE_PREFERENCES);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  return null;
}
