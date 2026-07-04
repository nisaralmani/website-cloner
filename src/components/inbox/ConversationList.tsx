"use client";

import {
  ChevronDown,
  ListFilter,
  Plus,
  Share2,
  ChevronUp,
  MoreHorizontal,
  ChevronRight,
  Clock,
  CheckSquare,
  Search,
  Trash2,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { appSettingsPath } from "@/lib/marketing-paths";
import type { Conversation, ConversationStatus } from "@/types/inbox";
import { PersonGlyph, CountryFlag } from "@/components/icons";
import { useSession } from "@/components/providers/SessionProvider";
import { useInboxCustomizeOptional } from "@/components/providers/InboxCustomizeProvider";
import type { InboxCustomizePreferences } from "@/lib/inbox/customize-preferences";
import { DEFAULT_INBOX_CUSTOMIZE_PREFERENCES } from "@/lib/inbox/customize-preferences";
import { ListBulkAssignPicker } from "@/components/inbox/ListBulkAssignPicker";
import { ListBulkStatusPicker } from "@/components/inbox/ListBulkStatusPicker";
import {
  ConversationListFilters,
  type ConversationListFiltersState,
} from "@/components/inbox/ConversationListFilters";
import type { KeyboardEvent } from "react";
import type { ConversationListSort } from "@/lib/inbox/snapshot";
import { isNotePreview } from "@/lib/inbox/notes";
import {
  formatSnoozedUntilLabel,
  isSnoozedUntilActive,
} from "@/lib/inbox/snooze-display";

const SORT_OPTIONS: { value: ConversationListSort; label: string }[] = [
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest First" },
  { value: "unread", label: "Most Unread" },
];

function ConversationCard({
  conversation,
  isSelected,
  isBulkSelected,
  bulkSelectionMode,
  onSelect,
  onToggleBulkSelect,
  onToggleUnread,
  customize,
}: {
  conversation: Conversation;
  isSelected: boolean;
  isBulkSelected?: boolean;
  bulkSelectionMode?: boolean;
  onSelect: (id: string) => void;
  onToggleBulkSelect?: (id: string) => void;
  onToggleUnread?: (id: string, unread: boolean) => void;
  customize: InboxCustomizePreferences;
}) {
  const isUnread = conversation.unread > 0;
  const isPending = conversation.status === "pending";
  const isSnoozed = isSnoozedUntilActive(conversation.snoozedUntil);
  const preview =
    !customize.showNotesInLastMessage && isNotePreview(conversation.preview)
      ? "—"
      : conversation.preview;

  const showBulkCheckbox = bulkSelectionMode || isBulkSelected;

  return (
    <div
      onClick={(event) => {
        if (bulkSelectionMode) {
          event.preventDefault();
          onToggleBulkSelect?.(conversation.id);
          return;
        }
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onToggleBulkSelect?.(conversation.id);
          return;
        }
        onSelect(conversation.id);
      }}
      className={cn(
        "flex min-h-[75px] cursor-pointer items-center gap-2 rounded-lg pt-[14px] pr-4 pb-4 pl-4",
        isPending || isUnread ? "bg-[#EBF3FE]" : "bg-white hover:bg-[#F4F6FB]",
        isSnoozed && "opacity-80",
        isSelected && "border-l-[3px] border-[#0093ee] pl-[13px]",
        isBulkSelected && "ring-2 ring-inset ring-[#1972F5]",
      )}
    >
      {showBulkCheckbox && (
        <input
          type="checkbox"
          checked={Boolean(isBulkSelected)}
          aria-label={
            isBulkSelected
              ? "Deselect conversation for bulk assign"
              : "Select conversation for bulk assign"
          }
          onChange={() => onToggleBulkSelect?.(conversation.id)}
          onClick={(event) => event.stopPropagation()}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#1972F5] accent-[#1972F5]"
        />
      )}

      <input
        type="checkbox"
        checked={isUnread}
        aria-label={isUnread ? "Mark conversation as read" : "Mark conversation as unread"}
        onChange={() => onToggleUnread?.(conversation.id, !isUnread)}
        onClick={(event) => event.stopPropagation()}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#D7DCE5] accent-[#1972F5]"
      />

      <div className="relative shrink-0">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
            conversation.avatarGradient,
          )}
        >
          {conversation.initials ? (
            conversation.initials
          ) : (
            <PersonGlyph size={20} />
          )}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-white">
          <CountryFlag code={conversation.country} className="text-[10px]" />
        </div>
        {customize.showAssignee && conversation.assignee && (
          <div
            className={cn(
              "absolute -bottom-0.5 -left-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gradient-to-br text-white ring-2 ring-white",
              conversation.assignee.avatarGradient,
            )}
            title={`Assigned to ${conversation.assignee.name}`}
          >
            <PersonGlyph size={10} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-sm font-bold text-[#0093ee]">
            {conversation.name}
          </span>
          <span className="ml-auto shrink-0 whitespace-nowrap text-xs font-medium text-[#828ea1]">
            {conversation.time}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              isUnread ? "font-bold text-[#25374F]" : "font-medium text-[#5D6B98]",
            )}
          >
            {preview}
          </p>
          {isUnread && (
            <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#2494E8] px-1 text-[11px] font-bold text-white">
              {conversation.unread}
            </span>
          )}
          <span className="flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full bg-[#2494E8] text-white">
            <ChevronRight size={14} strokeWidth={2.5} />
          </span>
        </div>
        {customize.showAssignee && conversation.assignee && (
          <p
            className="mt-1 truncate text-xs font-semibold text-[#5D6B98]"
            title={`Assigned to ${conversation.assignee.name}`}
          >
            {conversation.assignee.name}
          </p>
        )}
        {customize.showChannel && conversation.channel && (
          <p className="mt-1 truncate text-xs font-medium text-[#828ea1]">{conversation.channel}</p>
        )}
        {customize.showSegments && (conversation.segments?.length ?? 0) > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {conversation.segments!.map((segment) => (
              <span
                key={segment}
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  segment === "shopify"
                    ? "bg-[#F2F8F2] text-[#5DAC5D]"
                    : "bg-[#E8F0FE] text-[#1972F5]",
                )}
              >
                {segment === "shopify" ? "🛒 shopify" : segment}
              </span>
            ))}
          </div>
        )}
        {isSnoozed && conversation.snoozedUntil && (
          <p
            className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#7C3AED]"
            title={`Snoozed until ${formatSnoozedUntilLabel(conversation.snoozedUntil)}`}
          >
            <Clock size={12} strokeWidth={2.25} />
            Snoozed until {formatSnoozedUntilLabel(conversation.snoozedUntil)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ConversationList({
  conversations,
  loading,
  error,
  selectedId,
  listSearchInput = "",
  onListSearchInputChange,
  onListSearchKeyDown,
  bulkSelectedIds,
  bulkSelectionMode,
  onSelect,
  onToggleBulkSelect,
  onToggleUnread,
  onBulkAssign,
  onBulkDelete,
  onBulkStatusChange,
  bulkAssigning,
  bulkDeleting,
  onEnterBulkSelectionMode,
  onExitBulkSelectionMode,
  onSelectAllBulk,
  onClearBulkSelection,
  onCreateConversation,
  creatingConversation,
  listSort = "recent",
  onListSortChange,
  onShareConversation,
  listFilters,
  onListFiltersChange,
}: {
  conversations: Conversation[];
  loading?: boolean;
  error?: string | null;
  selectedId: string | null;
  listSearchInput?: string;
  onListSearchInputChange?: (value: string) => void;
  onListSearchKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  bulkSelectedIds?: string[];
  bulkSelectionMode?: boolean;
  onSelect: (id: string) => void;
  onToggleBulkSelect?: (id: string) => void;
  onToggleUnread?: (id: string, unread: boolean) => void;
  onBulkAssign?: (assignedOperatorId: string | null) => Promise<unknown>;
  onBulkDelete?: () => Promise<unknown>;
  onBulkStatusChange?: (status: ConversationStatus) => Promise<unknown>;
  bulkAssigning?: boolean;
  bulkDeleting?: boolean;
  onEnterBulkSelectionMode?: () => void;
  onExitBulkSelectionMode?: () => void;
  onSelectAllBulk?: () => void;
  onClearBulkSelection?: () => void;
  onCreateConversation?: () => void;
  creatingConversation?: boolean;
  listSort?: ConversationListSort;
  onListSortChange?: (sort: ConversationListSort) => void;
  onShareConversation?: () => void;
  listFilters?: ConversationListFiltersState;
  onListFiltersChange?: (filters: ConversationListFiltersState) => void;
}) {
  const customize = useInboxCustomizeOptional();
  const resolvedCustomize = customize ?? DEFAULT_INBOX_CUSTOMIZE_PREFERENCES;
  const { user } = useSession();
  const [sortOpen, setSortOpen] = useState(false);
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const footerMenuRef = useRef<HTMLDivElement>(null);
  const sortLabel =
    SORT_OPTIONS.find((option) => option.value === listSort)?.label ?? "Most Recent";
  const showOnlineDot =
    user?.presence !== "offline" && user?.forceOffline !== true;
  const bulkSelectedSet = new Set(bulkSelectedIds ?? []);
  const bulkSelectionActive = bulkSelectedSet.size > 0;
  const allVisibleSelected =
    conversations.length > 0 && conversations.every((conversation) => bulkSelectedSet.has(conversation.id));

  useEffect(() => {
    if (!footerMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (footerMenuRef.current && !footerMenuRef.current.contains(event.target as Node)) {
        setFooterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [footerMenuOpen]);

  return (
    <div className="flex h-full w-[326px] shrink-0 flex-col border-r border-[#E6EAF0] bg-white">
      <div className="flex h-[45px] shrink-0 items-center justify-between border-b border-[#E6EAF0] bg-white px-4">
        {bulkSelectionMode ? (
          <>
            <button
              type="button"
              onClick={onExitBulkSelectionMode}
              className="rounded-md px-2 py-1 text-sm font-semibold text-[#2C405A] hover:bg-[#F4F6FB]"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#828EA1]">
                {bulkSelectedSet.size} selected
              </span>
              <button
                type="button"
                onClick={allVisibleSelected ? onClearBulkSelection : onSelectAllBulk}
                disabled={conversations.length === 0}
                className="rounded-md px-2 py-1 text-xs font-semibold text-[#1972F5] hover:bg-[#EBF3FE] disabled:opacity-50"
              >
                {allVisibleSelected ? "Clear all" : "Select all"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div ref={sortRef} className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((open) => !open)}
                className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-[#F4F6FB]"
              >
                <span className="text-sm font-bold text-[#1C293B]">{sortLabel}</span>
                <ChevronDown size={16} className="text-[#828EA1]" />
              </button>
              {sortOpen ? (
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded border border-[#E8EAEB] bg-white py-1 shadow-lg">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onListSortChange?.(option.value);
                        setSortOpen(false);
                      }}
                      className="flex w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {resolvedCustomize.showSnoozed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F3E8FF] px-2 py-0.5 text-[11px] font-semibold text-[#7C3AED]">
                  <Clock size={12} strokeWidth={2.25} />
                  Snoozed shown
                </span>
              )}
              <button
                type="button"
                onClick={onEnterBulkSelectionMode}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-[#F4F6FB]"
                aria-label="Select conversations for bulk assign"
              >
                <CheckSquare size={16} className="text-[#2C405A]" />
                <span className="text-sm font-semibold text-[#2C405A]">Select</span>
              </button>
              {listFilters && onListFiltersChange ? (
                <ConversationListFilters
                  filters={listFilters}
                  onChange={onListFiltersChange}
                />
              ) : (
                <button type="button" className="flex items-center gap-1.5">
                  <ListFilter size={16} className="text-[#2C405A]" />
                  <span className="text-sm font-semibold text-[#2C405A]">Filters</span>
                </button>
              )}
              <button
                type="button"
                disabled={creatingConversation || !onCreateConversation}
                onClick={onCreateConversation}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[#F4F6FB] disabled:opacity-50"
                aria-label="Create a new conversation"
              >
                <Plus size={18} className="text-[#0093EE]" />
              </button>
            </div>
          </>
        )}
      </div>

      {!bulkSelectionMode && onListSearchInputChange && onListSearchKeyDown ? (
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#E6EAF0] bg-white px-3">
          <Search size={16} className="shrink-0 text-[#828EA1]" />
          <input
            type="text"
            value={listSearchInput}
            onChange={(event) => onListSearchInputChange(event.target.value)}
            onKeyDown={onListSearchKeyDown}
            placeholder="Filter conversations…"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#1C293B] outline-none placeholder:text-[#828EA1]"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto bg-[#F4F6FB] p-2">
        {loading ? (
          <p className="px-2 py-4 text-center text-sm text-[#828EA1]">Loading conversations…</p>
        ) : error ? (
          <p className="px-2 py-4 text-center text-sm text-[#B91C1C]">{error}</p>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-[#828EA1]">No conversations yet.</p>
        ) : (
          conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === selectedId}
              isBulkSelected={bulkSelectedSet.has(conversation.id)}
              bulkSelectionMode={bulkSelectionMode}
              onSelect={onSelect}
              onToggleBulkSelect={onToggleBulkSelect}
              onToggleUnread={onToggleUnread}
              customize={resolvedCustomize}
            />
          ))
        )}
      </div>

      <div className="flex h-[52px] shrink-0 items-center justify-between border-t border-[#E6EAF0] bg-white px-4">
        <button
          type="button"
          disabled={!onShareConversation}
          onClick={onShareConversation}
          className="flex items-center gap-1 rounded-md px-1 py-1 hover:bg-[#F4F6FB] disabled:opacity-40"
          aria-label="Copy conversation link"
        >
          <Share2 size={18} className="text-[#828EA1]" />
          <ChevronUp size={12} className="text-[#828EA1]" />
        </button>
        <div className="relative flex items-center gap-2">
          {bulkSelectionActive ? (
            <>
              <ListBulkAssignPicker
                selectedCount={bulkSelectedSet.size}
                updating={bulkAssigning}
                onAssign={onBulkAssign}
              />
              <ListBulkStatusPicker
                selectedCount={bulkSelectedSet.size}
                updating={bulkAssigning || bulkDeleting}
                onStatusChange={onBulkStatusChange}
              />
              <button
                type="button"
                disabled={bulkDeleting || !onBulkDelete}
                onClick={() => void onBulkDelete?.()}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EF4444] text-white disabled:opacity-60"
                aria-label={`Delete ${bulkSelectedSet.size} selected conversations`}
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-white",
                  user?.avatarGradient ?? "from-emerald-400 to-cyan-500",
                )}
              >
                <PersonGlyph size={16} />
              </div>
              {showOnlineDot && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#40B630] ring-2 ring-white" />
              )}
            </>
          )}
        </div>
        <div ref={footerMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setFooterMenuOpen((open) => !open)}
            className="rounded-md p-1 hover:bg-[#F4F6FB]"
            aria-label="List actions"
          >
            <MoreHorizontal size={18} className="text-[#828EA1]" />
          </button>
          {footerMenuOpen ? (
            <div className="absolute bottom-full right-0 z-20 mb-1 min-w-[200px] rounded-lg border border-[#E6EAF0] bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setFooterMenuOpen(false);
                  onEnterBulkSelectionMode?.();
                }}
                className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#2C405A] hover:bg-[#F4F6FB]"
              >
                Select conversations
              </button>
              <button
                type="button"
                disabled={!onShareConversation}
                onClick={() => {
                  setFooterMenuOpen(false);
                  onShareConversation?.();
                }}
                className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#2C405A] hover:bg-[#F4F6FB] disabled:opacity-40"
              >
                Copy conversation link
              </button>
              <Link
                href={appSettingsPath("inbox/customize")}
                onClick={() => setFooterMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-[#2C405A] hover:bg-[#F4F6FB]"
              >
                Customize inbox
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
