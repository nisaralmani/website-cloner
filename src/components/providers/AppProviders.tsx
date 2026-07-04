"use client";

import { SearchProvider } from "@/components/search/SearchProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { AppPresenceTracker } from "@/hooks/useAppPresence";
import GlobalSearchOverlay from "@/components/search/GlobalSearchOverlay";

import { InterfacePreferencesApplier } from "@/components/providers/InterfacePreferencesApplier";
import { ShortcutPreferencesProvider } from "@/components/providers/ShortcutPreferencesProvider";
import { InboxCustomizeProvider } from "@/components/providers/InboxCustomizeProvider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InterfacePreferencesApplier />
      <InboxCustomizeProvider>
        <ShortcutPreferencesProvider>
          <AppPresenceTracker />
          <SearchProvider>
            {children}
            <GlobalSearchOverlay />
          </SearchProvider>
        </ShortcutPreferencesProvider>
      </InboxCustomizeProvider>
    </SessionProvider>
  );
}
