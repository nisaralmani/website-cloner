"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PageConfig } from "@/lib/settings-data";
import { isAvailabilityPage, isAvailabilityPresenceKey } from "@/lib/settings/availability";
import { extractDefaultToggles } from "@/lib/settings/toggles";
import { isUserFieldSettingsPage } from "@/lib/settings/user-pages";
import { useSession } from "@/components/providers/SessionProvider";
import { useShortcutPreferencesOptional } from "@/components/providers/ShortcutPreferencesProvider";

import { useInboxCustomizeOptional } from "@/components/providers/InboxCustomizeProvider";

const SHORTCUTS_PAGE = "account/shortcuts";
const INBOX_CUSTOMIZE_PAGE = "inbox/customize";

export function useSettingsToggles(pageSlug: string, config: PageConfig) {
  const isFieldPage = isUserFieldSettingsPage(pageSlug);
  const defaults = useMemo(() => extractDefaultToggles(config), [config]);
  const [toggles, setToggles] = useState<Record<string, boolean>>(defaults);
  const [loading, setLoading] = useState(!isFieldPage);
  const [error, setError] = useState<string | null>(null);
  const { refresh: refreshSession } = useSession();
  const shortcutPreferences = useShortcutPreferencesOptional();
  const inboxCustomize = useInboxCustomizeOptional();

  useEffect(() => {
    if (isFieldPage) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch(`/api/settings/${pageSlug}`);
        if (!response.ok) {
          throw new Error("Failed to load settings");
        }
        const data = (await response.json()) as { toggles: Record<string, boolean> };
        if (!cancelled) {
          setToggles(data.toggles);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load settings.");
          setToggles(defaults);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [defaults, isFieldPage, pageSlug]);

  const setToggle = useCallback(
    async (localKey: string, on: boolean) => {
      setToggles((current) => ({ ...current, [localKey]: on }));
      try {
        const response = await fetch(`/api/settings/${pageSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: localKey, on }),
        });
        if (!response.ok) {
          throw new Error("Failed to save setting");
        }

        if (isAvailabilityPage(pageSlug) && isAvailabilityPresenceKey(localKey)) {
          await refreshSession();
        }

        if (pageSlug === SHORTCUTS_PAGE) {
          await shortcutPreferences?.refresh();
        }

        if (pageSlug === INBOX_CUSTOMIZE_PAGE) {
          await inboxCustomize?.refresh();
        }
      } catch {
        setToggles((current) => ({
          ...current,
          [localKey]: !on,
        }));
        setError("Unable to save setting.");
      }
    },
    [inboxCustomize, pageSlug, refreshSession, shortcutPreferences],
  );

  return { toggles, loading, error, setToggle };
}
