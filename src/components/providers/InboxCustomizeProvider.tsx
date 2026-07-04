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
  DEFAULT_INBOX_CUSTOMIZE_FIELDS,
  DEFAULT_INBOX_CUSTOMIZE_PREFERENCES,
  inboxCustomizeFromSettings,
  type InboxCustomizePreferences,
} from "@/lib/inbox/customize-preferences";

type InboxCustomizeContextValue = InboxCustomizePreferences & {
  loading: boolean;
  refresh: () => Promise<void>;
};

const InboxCustomizeContext = createContext<InboxCustomizeContextValue | null>(null);

const CUSTOMIZE_PAGE = "inbox/customize";

export function InboxCustomizeProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, workspace } = useSession();
  const [preferences, setPreferences] = useState<InboxCustomizePreferences>(
    DEFAULT_INBOX_CUSTOMIZE_PREFERENCES,
  );
  const [loading, setLoading] = useState(authenticated);

  const refresh = useCallback(async () => {
    if (!authenticated || !workspace) {
      setPreferences(DEFAULT_INBOX_CUSTOMIZE_PREFERENCES);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/settings/${CUSTOMIZE_PAGE}`);
      if (!response.ok) {
        throw new Error("Failed to load inbox customize settings");
      }

      const data = (await response.json()) as {
        toggles?: Record<string, boolean>;
        fields?: Record<string, string>;
      };

      setPreferences(
        inboxCustomizeFromSettings(
          data.toggles ?? {},
          data.fields ?? { ...DEFAULT_INBOX_CUSTOMIZE_FIELDS },
        ),
      );
    } catch {
      setPreferences(DEFAULT_INBOX_CUSTOMIZE_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, [authenticated, workspace]);

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
    <InboxCustomizeContext.Provider value={value}>{children}</InboxCustomizeContext.Provider>
  );
}

export function useInboxCustomize() {
  const context = useContext(InboxCustomizeContext);
  if (!context) {
    throw new Error("useInboxCustomize must be used within InboxCustomizeProvider");
  }
  return context;
}

export function useInboxCustomizeOptional() {
  return useContext(InboxCustomizeContext);
}
