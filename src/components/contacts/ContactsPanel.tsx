"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  Columns3,
  Mail,
  MapPin,
  MoreHorizontal,
  Search,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContacts } from "@/hooks/useContacts";
import { useShopifyContactSync } from "@/hooks/useShopifyContactSync";
import { useShopifySyncStatus } from "@/hooks/useShopifySyncStatus";
import { ContactPreviewModal } from "@/components/contacts/ContactPreviewModal";
import { ContactCreateModal } from "@/components/contacts/ContactCreateModal";
import { ContactFilterModal } from "@/components/contacts/ContactFilterModal";
import { useContactFilterContext } from "@/components/contacts/ContactFilterContext";
import type { Contact, ContactSegment } from "@/types/contacts";
import { PersonGlyph } from "@/components/icons";

import { DOCS_CONTACTS_URL } from "@/lib/docs-links";
const COLUMN_STORAGE_KEY = "bybelt:contact-columns";

type ContactColumnKey = "email" | "location" | "company" | "segments" | "lastActive" | "score";

const DEFAULT_COLUMNS: Record<ContactColumnKey, boolean> = {
  email: true,
  location: true,
  company: true,
  segments: true,
  lastActive: true,
  score: true,
};

function readColumnVisibility(): Record<ContactColumnKey, boolean> {
  if (typeof window === "undefined") return DEFAULT_COLUMNS;
  try {
    const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return DEFAULT_COLUMNS;
    const parsed = JSON.parse(raw) as Partial<Record<ContactColumnKey, boolean>>;
    return { ...DEFAULT_COLUMNS, ...parsed };
  } catch {
    return DEFAULT_COLUMNS;
  }
}

const SEGMENT_STYLES: Record<ContactSegment, { bg: string; text: string }> = {
  chat: { bg: "bg-[#FDF4EC]", text: "text-[#E07415]" },
  shopify: { bg: "bg-[#F2F8F2]", text: "text-[#5DAC5D]" },
};

function SegmentTag({ segment }: { segment: ContactSegment }) {
  const style = SEGMENT_STYLES[segment];
  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-sm",
        style.bg,
        style.text,
      )}
    >
      {segment}
    </span>
  );
}

function shopifyCustomerSearchUrl(shopAdminBase: string, email: string): string {
  return `${shopAdminBase.replace(/\/$/, "")}/customers?query=${encodeURIComponent(email)}`;
}

function ContactRow({
  contact,
  selected,
  visibleColumns,
  menuOpen,
  onToggleMenu,
  onPreview,
  onDelete,
  onToggleSelect,
  deleting,
  shopAdminBase,
}: {
  contact: Contact;
  selected: boolean;
  visibleColumns: Record<ContactColumnKey, boolean>;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onPreview: (contactId: string) => void;
  onDelete: (contactId: string) => void;
  onToggleSelect: (contactId: string) => void;
  deleting: boolean;
  shopAdminBase?: string | null;
}) {
  return (
    <tr className="border-b border-[#F4F4F5] text-sm font-semibold text-[#1C293B]">
      <td className="relative w-9 px-2 text-center">
        <button
          type="button"
          onClick={onToggleMenu}
          className="text-[#828EA1]"
          aria-label="Row actions"
        >
          <MoreHorizontal size={16} />
        </button>
        {menuOpen ? (
          <div className="absolute left-2 top-full z-20 mt-1 min-w-[120px] rounded border border-[#E8EAEB] bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => onPreview(contact.id)}
              className="flex w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
            >
              Preview
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete(contact.id)}
              className="flex w-full px-3 py-2 text-left text-sm font-semibold text-[#EF4444] hover:bg-[#F4F6FB] disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ) : null}
      </td>
      <td className="w-8 px-1 text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(contact.id)}
          className="h-4 w-4 rounded border-[#D7DCE5]"
          aria-label={`Select ${contact.name}`}
        />
      </td>
      <td className="min-w-[158px] px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white",
              contact.avatarGradient,
            )}
          >
            {contact.initials ? contact.initials : <PersonGlyph size={14} />}
          </div>
          <span className="truncate">{contact.name}</span>
          {shopAdminBase && contact.segments.includes("shopify") ? (
            <a
              href={shopifyCustomerSearchUrl(shopAdminBase, contact.email)}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#5DAC5D] hover:underline"
              title="Open in Shopify admin"
            >
              Shopify
            </a>
          ) : null}
        </div>
      </td>
      {visibleColumns.email ? (
        <td className="min-w-[158px] max-w-[158px] truncate px-3 py-2">{contact.email}</td>
      ) : null}
      {visibleColumns.location ? (
        <td className="min-w-[158px] max-w-[158px] truncate px-3 py-2">{contact.location}</td>
      ) : null}
      {visibleColumns.company ? (
        <td className="min-w-[106px] px-3 py-2 text-[#5D6B98]">{contact.company}</td>
      ) : null}
      {visibleColumns.segments ? (
        <td className="min-w-[127px] px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {contact.segments.map((segment) => (
              <SegmentTag key={segment} segment={segment} />
            ))}
          </div>
        </td>
      ) : null}
      {visibleColumns.lastActive ? (
        <td className="min-w-[106px] px-3 py-2">{contact.lastActive}</td>
      ) : null}
      {visibleColumns.score ? (
        <td className="min-w-[104px] px-3 py-2">{contact.score}</td>
      ) : null}
      <td className="min-w-[139px] px-3 py-2 text-center">
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreview(contact.id)}
            className="rounded bg-[#1972F5] px-3 py-1.5 text-xs font-bold text-white"
          >
            Preview
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(contact.id)}
            className="text-xs font-semibold text-[#EF4444] disabled:opacity-60"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ContactsPanel() {
  const searchParams = useSearchParams();
  const filterContext = useContactFilterContext();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<"" | ContactSegment>("");
  const [previewContactId, setPreviewContactId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkSegmenting, setBulkSegmenting] = useState(false);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(readColumnVisibility);
  const actionsRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const { contacts, total, loading, error, reload } = useContacts(
    searchQuery,
    segmentFilter,
  );
  const { sync: syncShopifyContacts, syncing: shopifySyncing, message: shopifySyncMessage } =
    useShopifyContactSync();
  const { status: shopifyStatus, lastSyncLabel, reload: reloadShopifyStatus } =
    useShopifySyncStatus();

  useEffect(() => {
    const segment = searchParams.get("segment");
    const query = searchParams.get("q") ?? "";
    if (segment === "chat" || segment === "shopify") {
      setSegmentFilter(segment);
    } else if (segment === "all" || segment === "") {
      setSegmentFilter("");
    }
    setSearchQuery(query);
    setSearchInput(query);
  }, [searchParams]);

  useEffect(() => {
    if (!actionsOpen && !columnsOpen && !rowMenuId) return;
    const handleClick = (event: MouseEvent) => {
      if (actionsRef.current?.contains(event.target as Node)) return;
      if (columnsRef.current?.contains(event.target as Node)) return;
      setActionsOpen(false);
      setColumnsOpen(false);
      setRowMenuId(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionsOpen, columnsOpen, rowMenuId]);

  const toggleColumn = (key: ContactColumnKey) => {
    setVisibleColumns((current) => {
      const next = { ...current, [key]: !current[key] };
      window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setSearchQuery(searchInput);
    }
  };

  const handleCreateContact = () => {
    setCreateOpen(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    setDeletingId(contactId);
    try {
      const response = await fetch(`/api/contacts/${contactId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete contact");
      setSelectedIds((current) => current.filter((id) => id !== contactId));
      await reload();
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleSelect = (contactId: string) => {
    setSelectedIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(`Delete ${selectedIds.length} contact(s)?`);
    if (!confirmed) return;

    setBulkDeleting(true);
    setActionsOpen(false);
    try {
      const response = await fetch("/api/contacts/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: selectedIds }),
      });
      if (!response.ok) throw new Error("Failed to bulk delete contacts");
      setSelectedIds([]);
      await reload();
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setActionsOpen(false);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (segmentFilter) params.set("segment", segmentFilter);
      const query = params.size > 0 ? `?${params.toString()}` : "";
      const response = await fetch(`/api/contacts/export${query}`);
      if (!response.ok) throw new Error("Failed to export contacts");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "contacts.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Unable to export contacts. Try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleBulkSegment = async (segment: ContactSegment) => {
    if (selectedIds.length === 0) return;
    setBulkSegmenting(true);
    setActionsOpen(false);
    try {
      const response = await fetch("/api/contacts/bulk-segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: selectedIds, segment }),
      });
      if (!response.ok) throw new Error("Failed to add segment");
      setSelectedIds([]);
      await reload();
    } finally {
      setBulkSegmenting(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-[#F4F4F5] px-8 py-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-[#2C405A]" strokeWidth={1.75} />
          <h1 className="text-base font-semibold text-[#2C405A]">
            {total} Contacts
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-9 items-center gap-1 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-1">
            {(["", "chat", "shopify"] as const).map((segment) => (
              <button
                key={segment || "all"}
                type="button"
                onClick={() => setSegmentFilter(segment)}
                className={cn(
                  "rounded px-2 py-1 text-xs font-semibold capitalize",
                  segmentFilter === segment
                    ? "bg-[#1972F5] text-white"
                    : "text-[#5D6B98] hover:text-[#1C293B]",
                )}
              >
                {segment || "All"}
              </button>
            ))}
          </div>
          <div className="flex h-9 w-[250px] items-center gap-2 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2">
            <Search size={18} className="shrink-0 text-[#828EA1]" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search"
              className="w-full bg-transparent text-sm text-[#1C293B] outline-none placeholder:text-[#828EA1]"
            />
          </div>
          <button
            type="button"
            disabled={shopifySyncing}
            onClick={() => {
              void syncShopifyContacts().then((ok) => {
                if (ok) {
                  void reload();
                  void reloadShopifyStatus();
                }
              });
            }}
            className="h-9 rounded border border-[#E8EAEB] bg-white px-3 text-xs font-semibold text-[#5DAC5D] hover:bg-[#F2F8F2] disabled:opacity-60"
          >
            {shopifySyncing ? "Syncing…" : "Sync Shopify"}
          </button>
          <div ref={columnsRef} className="relative">
            <button
              type="button"
              onClick={() => setColumnsOpen((open) => !open)}
              className="flex h-[37px] w-11 items-center justify-center rounded border border-[#E8EAEB] bg-[#F8F9F9] text-[#333E4F]"
              aria-label="Column layout"
            >
              <Columns3 size={18} />
            </button>
            {columnsOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded border border-[#E8EAEB] bg-white py-2 shadow-lg">
                {(Object.keys(DEFAULT_COLUMNS) as ContactColumnKey[]).map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm font-semibold capitalize text-[#1C293B]"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[key]}
                      onChange={() => toggleColumn(key)}
                    />
                    {key === "lastActive" ? "Last Active" : key}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <a
            href={DOCS_CONTACTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[37px] w-11 items-center justify-center rounded bg-[#1972F5] text-white"
            aria-label="Documentation"
          >
            <BookOpen size={18} />
          </a>
          <button
            type="button"
            onClick={handleCreateContact}
            className="h-[37px] rounded bg-[#1C293B] px-4 text-sm font-semibold text-white"
          >
            New Contact
          </button>
          <div ref={actionsRef} className="relative">
            <button
              type="button"
              disabled={bulkDeleting || bulkSegmenting}
              onClick={() => setActionsOpen((open) => !open)}
              className="inline-flex h-[37px] items-center gap-1 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-semibold text-[#333E4F] disabled:opacity-60"
            >
              Actions
              <ChevronDown size={16} />
              {selectedIds.length > 0 ? (
                <span className="ml-1 rounded bg-[#1972F5] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {selectedIds.length}
                </span>
              ) : null}
            </button>
            {actionsOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded border border-[#E8EAEB] bg-white py-1 shadow-lg">
                <button
                  type="button"
                  disabled={exporting || contacts.length === 0}
                  onClick={() => void handleExportCsv()}
                  className="flex w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] disabled:opacity-50"
                >
                  {exporting ? "Exporting…" : "Export CSV"}
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0 || bulkSegmenting}
                  onClick={() => void handleBulkSegment("chat")}
                  className="flex w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] disabled:opacity-50"
                >
                  {bulkSegmenting ? "Updating…" : "Add chat segment"}
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0 || bulkSegmenting}
                  onClick={() => void handleBulkSegment("shopify")}
                  className="flex w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] disabled:opacity-50"
                >
                  Add shopify segment
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0 || bulkDeleting}
                  onClick={() => void handleBulkDelete()}
                  className="flex w-full px-3 py-2 text-left text-sm font-semibold text-[#EF4444] disabled:opacity-50"
                >
                  {bulkDeleting ? "Deleting…" : "Delete selected"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {shopifySyncMessage ? (
        <p className="border-b border-[#F4F4F5] px-8 py-2 text-sm text-[#5D6B98]">{shopifySyncMessage}</p>
      ) : null}
      {shopifyStatus?.linked && lastSyncLabel ? (
        <p className="border-b border-[#F4F4F5] px-8 py-2 text-xs text-[#828EA1]">
          Last Shopify sync: {lastSyncLabel}
          {shopifyStatus.lastContactSyncTotal != null
            ? ` · ${shopifyStatus.lastContactSyncTotal} customers`
            : ""}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto bg-[#FBFBFB]">
        {loading ? (
          <p className="px-8 py-6 text-sm text-[#828EA1]">Loading contacts…</p>
        ) : error ? (
          <p className="px-8 py-6 text-sm text-[#828EA1]">{error}</p>
        ) : contacts.length === 0 ? (
          <p className="px-8 py-6 text-sm text-[#828EA1]">No contacts found.</p>
        ) : (
          <table className="w-full min-w-[1136px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#FBFBFB]">
              <tr className="border-b border-[#F4F4F5] text-[13.5px] font-semibold text-[#75869C]">
                <th className="w-9 px-2" />
                <th className="w-8 px-1" />
                <th className="min-w-[158px] px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <User size={14} />
                    Full Name
                  </span>
                </th>
                {visibleColumns.email ? (
                  <th className="min-w-[158px] px-3 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail size={14} />
                      Email
                    </span>
                  </th>
                ) : null}
                {visibleColumns.location ? (
                  <th className="min-w-[158px] px-3 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} />
                      Location
                    </span>
                  </th>
                ) : null}
                {visibleColumns.company ? <th className="min-w-[106px] px-3 py-2">Company</th> : null}
                {visibleColumns.segments ? <th className="min-w-[127px] px-3 py-2">Segments</th> : null}
                {visibleColumns.lastActive ? <th className="min-w-[106px] px-3 py-2">Last Active</th> : null}
                {visibleColumns.score ? <th className="min-w-[104px] px-3 py-2">Score</th> : null}
                <th className="min-w-[139px] px-3 py-2 text-center">Preview</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  selected={selectedIds.includes(contact.id)}
                  visibleColumns={visibleColumns}
                  menuOpen={rowMenuId === contact.id}
                  onToggleMenu={() =>
                    setRowMenuId((current) => (current === contact.id ? null : contact.id))
                  }
                  onPreview={(contactId) => {
                    setRowMenuId(null);
                    setPreviewContactId(contactId);
                  }}
                  onDelete={(contactId) => {
                    setRowMenuId(null);
                    void handleDeleteContact(contactId);
                  }}
                  onToggleSelect={handleToggleSelect}
                  deleting={deletingId === contact.id}
                  shopAdminBase={shopifyStatus?.linked ? shopifyStatus.shopAdminUrl : undefined}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ContactPreviewModal
        contactId={previewContactId}
        onClose={() => setPreviewContactId(null)}
        onUpdated={() => void reload()}
        onDeleted={() => void reload()}
      />
      <ContactCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void reload()}
      />
      {filterContext ? (
        <ContactFilterModal
          open={filterContext.createModalOpen}
          initialSegment={segmentFilter}
          initialQuery={searchQuery}
          onClose={filterContext.closeCreateModal}
          onSave={(input) => filterContext.addFilter(input)}
        />
      ) : null}
    </div>
  );
}
