"use client";

import { useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  LayoutGrid,
  MessageSquare,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useSearch } from "@/components/search/SearchProvider";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import {
  APP_CONTACTS_PATH,
  APP_INBOX_PATH,
  APP_PLUGINS_PATH,
  APP_SETTINGS_ROOT_PATH,
  appAnalyticsPath,
  appHelpdeskPath,
} from "@/lib/marketing-paths";
import type { SearchResult, SearchResultKind } from "@/types/search";

const NAV_ICONS: Record<string, LucideIcon> = {
  [APP_INBOX_PATH]: MessageSquare,
  [APP_CONTACTS_PATH]: Users,
  [appHelpdeskPath("articles")]: BookOpen,
  [appAnalyticsPath("messaging/overview")]: BarChart3,
  [APP_PLUGINS_PATH]: LayoutGrid,
  [APP_SETTINGS_ROOT_PATH]: Settings,
};

const SECTION_LABELS: Record<SearchResultKind, string> = {
  navigation: "Quick navigation",
  conversation: "Recent conversations",
  contact: "Contacts",
  plugin: "Plugins",
  settings: "Settings",
  campaign: "Campaigns",
  helpdesk: "Helpdesk",
  visitor: "Visitors",
  messageShortcut: "Message shortcuts",
};

function ResultIcon({ item }: { item: SearchResult }) {
  if (item.kind === "navigation") {
    const Icon = NAV_ICONS[item.href] ?? MessageSquare;
    return <Icon size={16} className="text-[#2C405A]" />;
  }
  if (item.kind === "contact") return <Users size={16} className="text-[#2C405A]" />;
  if (item.kind === "plugin") return <LayoutGrid size={16} className="text-[#2C405A]" />;
  if (item.kind === "settings") return <Settings size={16} className="text-[#2C405A]" />;
  return <MessageSquare size={16} className="text-[#2C405A]" />;
}

function SearchSection({
  kind,
  items,
  onSelect,
}: {
  kind: SearchResultKind;
  items: SearchResult[];
  onSelect: () => void;
}) {
  if (items.length === 0) return null;

  const isGrid = kind === "navigation";

  return (
    <>
      <p className="mt-4 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#828EA1] first:mt-0">
        {SECTION_LABELS[kind]}
      </p>
      {isGrid ? (
        <div className="grid grid-cols-2 gap-1">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={onSelect}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
            >
              <ResultIcon item={item} />
              {item.title}
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={onSelect}
              className="rounded-lg px-3 py-2 hover:bg-[#F4F6FB]"
            >
              <p className="text-sm font-semibold text-[#1C293B]">{item.title}</p>
              {item.subtitle && (
                <p className="truncate text-xs text-[#75869C]">{item.subtitle}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function GlobalSearchOverlay() {
  const { open, closeSearch } = useSearch();
  const [query, setQuery] = useState("");
  const { results, loading, error } = useGlobalSearch(query, open);

  const hasQuery = query.trim().length > 0;
  const conversations = results.conversations;
  const contacts = hasQuery ? results.contacts : [];
  const plugins = hasQuery ? results.plugins : [];
  const settings = hasQuery ? results.settings : [];
  const campaigns = hasQuery ? results.campaigns : [];
  const helpdesk = hasQuery ? results.helpdesk : [];
  const visitors = hasQuery ? results.visitors : [];
  const messageShortcuts = hasQuery ? results.messageShortcuts : [];

  const hasResults =
    results.navigation.length > 0 ||
    conversations.length > 0 ||
    contacts.length > 0 ||
    plugins.length > 0 ||
    settings.length > 0 ||
    campaigns.length > 0 ||
    helpdesk.length > 0 ||
    visitors.length > 0 ||
    messageShortcuts.length > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24"
      onClick={closeSearch}
      role="presentation"
    >
      <div
        className="w-full max-w-[640px] overflow-hidden rounded-lg border border-[#E8EAEB] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className="flex items-center gap-3 border-b border-[#E8EAEB] px-4 py-3">
          <Search size={18} className="shrink-0 text-[#828EA1]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations, contacts, campaigns…"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#1C293B] outline-none placeholder:text-[#828EA1]"
          />
          <button
            type="button"
            onClick={closeSearch}
            className="flex h-8 w-8 items-center justify-center rounded text-[#828EA1] hover:bg-[#F4F6FB]"
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {loading && (
            <p className="px-3 py-6 text-center text-sm text-[#828EA1]">Searching…</p>
          )}
          {error && (
            <p className="px-3 py-6 text-center text-sm text-[#828EA1]">{error}</p>
          )}
          {!loading && !error && (
            <>
              <SearchSection
                kind="navigation"
                items={results.navigation}
                onSelect={closeSearch}
              />
              <SearchSection
                kind="conversation"
                items={conversations}
                onSelect={closeSearch}
              />
              <SearchSection kind="contact" items={contacts} onSelect={closeSearch} />
              <SearchSection kind="campaign" items={campaigns} onSelect={closeSearch} />
              <SearchSection kind="helpdesk" items={helpdesk} onSelect={closeSearch} />
              <SearchSection kind="visitor" items={visitors} onSelect={closeSearch} />
              <SearchSection
                kind="messageShortcut"
                items={messageShortcuts}
                onSelect={closeSearch}
              />
              <SearchSection kind="plugin" items={plugins} onSelect={closeSearch} />
              <SearchSection kind="settings" items={settings} onSelect={closeSearch} />
            </>
          )}

          {!loading && !error && hasQuery && !hasResults && (
            <p className="px-3 py-8 text-center text-sm text-[#828EA1]">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        <div className="border-t border-[#E8EAEB] px-4 py-2 text-xs text-[#828EA1]">
          Press <kbd className="rounded bg-[#F4F6FB] px-1.5 py-0.5 font-mono">Ctrl</kbd>
          {" + "}
          <kbd className="rounded bg-[#F4F6FB] px-1.5 py-0.5 font-mono">F</kbd>
          {" to open search"}
        </div>
      </div>
    </div>
  );
}
