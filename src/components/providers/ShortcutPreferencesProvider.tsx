"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "@/components/providers/SessionProvider";
import {
  DEFAULT_SHORTCUT_PREFERENCES,
  shortcutPreferencesFromToggles,
  type ShortcutPreferences,
} from "@/lib/auth/shortcut-preferences";

type ShortcutPreferencesContextValue = ShortcutPreferences & {
  loading: boolean;
  refresh: () => Promise<void>;
};

const ShortcutPreferencesContext = createContext<ShortcutPreferencesContextValue | null>(null);

const SHORTCUTS_PAGE = "account/shortcuts";

export function ShortcutPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { authenticated } = useSession();
  const [preferences, setPreferences] = useState<ShortcutPreferences>(DEFAULT_SHORTCUT_PREFERENCES);
  const [loading, setLoading] = useState(authenticated);

  const refresh = useCallback(async () => {
    if (!authenticated) {
      setPreferences(DEFAULT_SHORTCUT_PREFERENCES);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/settings/${SHORTCUTS_PAGE}`);
      if (!response.ok) {
        throw new Error("Failed to load shortcut preferences");
      }

      const data = (await response.json()) as { toggles?: Record<string, boolean> };
      setPreferences(shortcutPreferencesFromToggles(data.toggles ?? {}));
    } catch {
      setPreferences(DEFAULT_SHORTCUT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...preferences,
      loading,
      refresh,
    }),
    [loading, preferences, refresh],
  );

  return (
    <ShortcutPreferencesContext.Provider value={value}>
      {children}
    </ShortcutPreferencesContext.Provider>
  );
}

export function useShortcutPreferences() {
  const context = useContext(ShortcutPreferencesContext);
  if (!context) {
    throw new Error("useShortcutPreferences must be used within ShortcutPreferencesProvider");
  }
  return context;
}

export function useShortcutPreferencesOptional() {
  return useContext(ShortcutPreferencesContext);
}
