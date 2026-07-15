"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import InboxSidebar, { type InboxListFilter } from "@/components/inbox/InboxSidebar";
import ConversationList from "@/components/inbox/ConversationList";
import {
  EMPTY_CONVERSATION_LIST_FILTERS,
  type ConversationListFiltersState,
} from "@/components/inbox/ConversationListFilters";
import ConversationPanel from "@/components/inbox/ConversationPanel";
import ConversationDetail from "@/components/inbox/ConversationDetail";
import CustomerInfoPanel from "@/components/inbox/CustomerInfoPanel";
import { useInboxApp } from "@/hooks/useConversations";
import { useMessageShortcutLookup, useMessageShortcuts } from "@/hooks/useMessageShortcuts";
import { useSubInboxes } from "@/hooks/useSubInboxes";
import { useUpgradePlan } from "@/hooks/useUpgradePlan";
import { useInboxCounts } from "@/hooks/useInboxCounts";
import { useSession } from "@/components/providers/SessionProvider";
import { resolveMessageShortcutText } from "@/lib/message-shortcuts/validation";
import { useInboxCustomize } from "@/components/providers/InboxCustomizeProvider";
import { useShopifySyncStatus } from "@/hooks/useShopifySyncStatus";
import { appConversationUrl } from "@/lib/marketing-paths";
import type { Conversation } from "@/types/inbox";

export default function InboxApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const conversationParam = searchParams.get("conversation");
  const [listSearchInput, setListSearchInput] = useState("");
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [inboxFilter, setInboxFilter] = useState<InboxListFilter>({ type: "main" });
  const [listFilters, setListFilters] = useState<ConversationListFiltersState>(
    EMPTY_CONVERSATION_LIST_FILTERS,
  );
  const [listSort, setListSort] = useState<"recent" | "oldest" | "unread">("recent");
  const { user: sessionUser } = useSession();
  const { counts: inboxCounts } = useInboxCounts();
  const { openBilling, opening: upgrading } = useUpgradePlan();
  const shortcutsByBang = useMessageShortcutLookup(true);
  const { shortcuts: messageShortcuts } = useMessageShortcuts(true);
  const {
    subInboxes,
    saving: creatingSubInbox,
    createSubInbox,
    refresh: refreshSubInboxes,
  } = useSubInboxes(true);
  const inboxCustomize = useInboxCustomize();
  const { status: shopifyStatus } = useShopifySyncStatus();

  const listFilter = useMemo(() => {
    const filter: {
      segment?: string;
      subInboxId?: string;
      status?: string;
      assignedOperatorId?: string;
    } = {};
    if (inboxFilter.type === "spam") filter.segment = "spam";
    if (inboxFilter.type === "shopify") filter.segment = "shopify";
    if (inboxFilter.type === "subInbox") filter.subInboxId = inboxFilter.id;
    if (inboxFilter.type === "getStarted") filter.status = "unassigned";
    else if (listFilters.status) filter.status = listFilters.status;
    if (listFilters.assignedToMe && sessionUser?.id) {
      filter.assignedOperatorId = sessionUser.id;
    } else if (listFilters.unassignedOnly) {
      filter.assignedOperatorId = "none";
    }
    return filter;
  }, [inboxFilter, listFilters, sessionUser]);

  const subInboxUnread = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of inboxCounts.subInboxes) {
      map[entry.id] = entry.unread;
    }
    return map;
  }, [inboxCounts.subInboxes]);

  const {
    conversations,
    listLoading,
    listError,
    reloadList,
    selectedId,
    messages,
    details,
    detailLoading,
    sending,
    sendMessage,
    sendNote,
    sendReminder,
    toggleUnread,
    updateCustomerEmail,
    updateConversationName,
    pauseListReorder,
    resumeListReorder,
    upsertVisitorData,
    removeVisitorData,
    addConversationSegment,
    removeConversationSegment,
    updateStatus,
    updateAssignedOperator,
    bulkAssignConversations,
    bulkDeleteConversations,
    bulkUpdateConversationStatus,
    deleteConversationById,
    createConversation,
    simulateVisitorMessage,
    deleteNote,
    updateNote,
    updateMessage,
    cancelReminder,
    savingEmail,
    savingVisitorData,
    savingSegments,
    savingAssignment,
    simulatingVisitor,
    deletingNoteId,
    updatingNoteId,
    updatingMessageId,
    cancellingReminderId,
    visitorTyping,
  } = useInboxApp(conversationParam, listSearchQuery, listFilter, listSort);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);

  const handleEnterBulkSelectionMode = useCallback(() => {
    setBulkSelectionMode(true);
  }, []);

  const handleExitBulkSelectionMode = useCallback(() => {
    setBulkSelectionMode(false);
    setBulkSelectedIds([]);
  }, []);

  const handleToggleBulkSelect = useCallback((id: string) => {
    setBulkSelectionMode(true);
    setBulkSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, []);

  const handleSelectAllBulk = useCallback(() => {
    setBulkSelectionMode(true);
    setBulkSelectedIds(conversations.map((conversation) => conversation.id));
  }, [conversations]);

  const handleClearBulkSelection = useCallback(() => {
    setBulkSelectedIds([]);
  }, []);

  const handleBulkAssign = useCallback(
    async (assignedOperatorId: string | null) => {
      if (bulkSelectedIds.length === 0) return;
      const updated = await bulkAssignConversations(bulkSelectedIds, assignedOperatorId);
      if (updated) {
        setBulkSelectedIds([]);
        setBulkSelectionMode(false);
        void reloadList({ silent: true });
      }
    },
    [bulkAssignConversations, bulkSelectedIds, reloadList],
  );

  const handleBulkDelete = useCallback(async () => {
    if (bulkSelectedIds.length === 0) return;
    const deleted = await bulkDeleteConversations(bulkSelectedIds);
    if (deleted) {
      setBulkSelectedIds([]);
      setBulkSelectionMode(false);
      void reloadList({ silent: true });
    }
  }, [bulkDeleteConversations, bulkSelectedIds, reloadList]);

  const handleBulkStatusChange = useCallback(
    async (status: Conversation["status"]) => {
      if (bulkSelectedIds.length === 0) return;
      const updated = await bulkUpdateConversationStatus(bulkSelectedIds, status);
      if (updated) {
        setBulkSelectedIds([]);
        setBulkSelectionMode(false);
        void reloadList({ silent: true });
      }
    },
    [bulkSelectedIds, bulkUpdateConversationStatus, reloadList],
  );

  const handleSend = useCallback(
    async (text: string, file?: File) => {
      const resolved = file ? text : resolveMessageShortcutText(text, shortcutsByBang);
      const sent = await sendMessage(resolved, file);
      if (sent) void reloadList({ silent: true });
    },
    [reloadList, sendMessage, shortcutsByBang],
  );

  const handleSendNote = useCallback(
    async (text: string) => {
      const sent = await sendNote(text);
      if (sent) void reloadList({ silent: true });
    },
    [reloadList, sendNote],
  );

  const handleSendReminder = useCallback(
    async (note: string, remindAt: string) => {
      const sent = await sendReminder(note, remindAt);
      if (sent) void reloadList({ silent: true });
    },
    [reloadList, sendReminder],
  );

  const handleCancelReminder = useCallback(
    async (reminderId: string) => {
      if (!selectedId) return;
      await cancelReminder(selectedId, reminderId);
    },
    [cancelReminder, selectedId],
  );

  const handleStatusChange = useCallback(
    async (status: Conversation["status"]) => {
      const updated = await updateStatus(status);
      if (updated) void reloadList({ silent: true });
    },
    [reloadList, updateStatus],
  );

  const handleAssigneeChange = useCallback(
    async (assignedOperatorId: string | null) => {
      if (!selectedId) return;
      const updated = await updateAssignedOperator(selectedId, assignedOperatorId);
      if (updated) void reloadList({ silent: true });
    },
    [reloadList, selectedId, updateAssignedOperator],
  );

  const handleToggleUnread = useCallback(
    async (id: string, unread: boolean) => {
      await toggleUnread(id, unread);
    },
    [toggleUnread],
  );

  const handleSaveCustomerEmail = useCallback(
    async (email: string | null) => {
      if (!selectedId) return false;
      return updateCustomerEmail(selectedId, email);
    },
    [selectedId, updateCustomerEmail],
  );

  const handleSaveVisitorData = useCallback(
    async (key: string, value: string) => {
      if (!selectedId) return false;
      return upsertVisitorData(selectedId, key, value);
    },
    [selectedId, upsertVisitorData],
  );

  const handleRemoveVisitorData = useCallback(
    async (key: string) => {
      if (!selectedId) return false;
      return removeVisitorData(selectedId, key);
    },
    [removeVisitorData, selectedId],
  );

  const handleAddSegment = useCallback(
    async (segment: string) => {
      if (!selectedId) return false;
      return addConversationSegment(selectedId, segment);
    },
    [addConversationSegment, selectedId],
  );

  const handleRemoveSegment = useCallback(
    async (segment: string) => {
      if (!selectedId) return false;
      return removeConversationSegment(selectedId, segment);
    },
    [removeConversationSegment, selectedId],
  );

  const handleSimulateVisitorMessage = useCallback(
    async (text: string) => {
      if (!selectedId) return false;
      const sent = await simulateVisitorMessage(selectedId, text);
      if (sent) void reloadList({ silent: true });
      return Boolean(sent);
    },
    [reloadList, selectedId, simulateVisitorMessage],
  );

  const handleDeleteNote = useCallback(
    async (messageId: string) => {
      if (!selectedId) return;
      const deleted = await deleteNote(selectedId, messageId);
      if (deleted) void reloadList({ silent: true });
    },
    [deleteNote, reloadList, selectedId],
  );

  const handleUpdateNote = useCallback(
    async (messageId: string, text: string) => {
      if (!selectedId) return false;
      const updated = await updateNote(selectedId, messageId, text);
      if (updated) void reloadList({ silent: true });
      return updated;
    },
    [reloadList, selectedId, updateNote],
  );

  const handleUpdateMessage = useCallback(
    async (messageId: string, text: string) => {
      if (!selectedId) return false;
      const updated = await updateMessage(selectedId, messageId, text);
      if (updated) void reloadList({ silent: true });
      return updated;
    },
    [reloadList, selectedId, updateMessage],
  );

  const handleSelect = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("conversation", id);
      } else {
        params.delete("conversation");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleMarkSpam = useCallback(async () => {
    if (!selectedId) return;
    const marked = await addConversationSegment(selectedId, "spam");
    if (marked) {
      handleSelect(null);
      void reloadList({ silent: true });
    }
  }, [addConversationSegment, handleSelect, reloadList, selectedId]);

  const handleSetSubject = useCallback(
    async (name: string) => {
      if (!selectedId) return;
      await updateConversationName(selectedId, name);
    },
    [selectedId, updateConversationName],
  );

  const handleSendTranscript = useCallback(async () => {
    if (!selectedId) return;
    const defaultEmail = details?.email?.trim() ?? "";
    const to = window.prompt("Send transcript to:", defaultEmail);
    if (!to?.trim()) return;
    const response = await fetch(`/api/conversations/${selectedId}/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: to.trim() }),
    });
    if (!response.ok) {
      window.alert("Unable to send transcript.");
      return;
    }
    window.alert(`Transcript sent to ${to.trim()}.`);
  }, [details?.email, selectedId]);

  const handleNextConversation = useCallback(() => {
    if (!selectedId || conversations.length === 0) return;
    const index = conversations.findIndex((conversation) => conversation.id === selectedId);
    if (index === -1 || index >= conversations.length - 1) return;
    handleSelect(conversations[index + 1].id);
  }, [conversations, handleSelect, selectedId]);

  const handlePreviousConversation = useCallback(() => {
    if (!selectedId || conversations.length === 0) return;
    const index = conversations.findIndex((conversation) => conversation.id === selectedId);
    if (index <= 0) return;
    handleSelect(conversations[index - 1].id);
  }, [conversations, handleSelect, selectedId]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!event.ctrlKey || !event.altKey) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        handleNextConversation();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        handlePreviousConversation();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextConversation, handlePreviousConversation]);

  const handleDeleteConversation = useCallback(async () => {
    if (!selectedId) return;
    const confirmed = window.confirm("Delete this conversation permanently?");
    if (!confirmed) return;
    const deleted = await deleteConversationById(selectedId);
    if (deleted) {
      handleSelect(null);
      void reloadList({ silent: true });
    }
  }, [deleteConversationById, handleSelect, reloadList, selectedId]);

  const handleBlockVisitor = useCallback(async () => {
    const email = details?.email?.trim();
    if (!email) {
      window.alert("Add a customer email before blocking this visitor.");
      return;
    }
    const confirmed = window.confirm(`Block visitor ${email}?`);
    if (!confirmed) return;
    const response = await fetch("/api/chatbox/restrictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "blocked_visitor", value: email }),
    });
    if (!response.ok) {
      window.alert("Unable to block visitor.");
      return;
    }
    window.alert(`Blocked ${email}.`);
  }, [details?.email]);

  const handleCreateConversation = useCallback(async () => {
    setCreatingConversation(true);
    try {
      const created = await createConversation();
      if (created) {
        handleSelect(created.id);
        void reloadList({ silent: true });
      }
    } finally {
      setCreatingConversation(false);
    }
  }, [createConversation, handleSelect, reloadList]);

  const handleCreateSubInbox = useCallback(async () => {
    const created = await createSubInbox();
    if (!created) return;
    const payload = await refreshSubInboxes();
    const latest = payload.subInboxes.at(-1);
    if (latest) {
      setInboxFilter({ type: "subInbox", id: latest.id });
      void reloadList();
    }
  }, [createSubInbox, refreshSubInboxes, reloadList]);

  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ?? null;

  const handleListSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setListSearchQuery(listSearchInput);
    }
  };

  useEffect(() => {
    const inbox = searchParams.get("inbox");
    if (inbox === "shopify" && shopifyStatus?.linked) {
      setInboxFilter({ type: "shopify" });
    } else if (inbox === "spam") {
      setInboxFilter({ type: "spam" });
    } else if (inbox === "started") {
      setInboxFilter({ type: "getStarted" });
    }
  }, [searchParams, shopifyStatus?.linked]);

  const handleInboxFilterChange = useCallback(
    (filter: InboxListFilter) => {
      setInboxFilter(filter);
      const params = new URLSearchParams(searchParams.toString());
      if (filter.type === "shopify") params.set("inbox", "shopify");
      else if (filter.type === "spam") params.set("inbox", "spam");
      else if (filter.type === "getStarted") params.set("inbox", "started");
      else if (filter.type === "main") params.delete("inbox");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
      void reloadList();
    },
    [pathname, reloadList, router, searchParams],
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-[#2c405a]">
      <InboxSidebar
        inboxFilter={inboxFilter}
        onInboxFilterChange={handleInboxFilterChange}
        subInboxes={subInboxes}
        subInboxUnread={subInboxUnread}
        creatingSubInbox={creatingSubInbox}
        onCreateSubInbox={() => void handleCreateSubInbox()}
        upgrading={upgrading}
        onUpgrade={async () => {
          await openBilling();
        }}
        shopifyLinked={shopifyStatus?.linked === true}
      />
      <ConversationList
        conversations={conversations}
        loading={listLoading}
        error={listError}
        selectedId={selectedId}
        listSearchInput={listSearchInput}
        onListSearchInputChange={setListSearchInput}
        onListSearchKeyDown={handleListSearchKeyDown}
        listFilters={listFilters}
        onListFiltersChange={(filters) => {
          setListFilters(filters);
          void reloadList();
        }}
        listSort={listSort}
        onListSortChange={(sort) => {
          setListSort(sort);
          void reloadList();
        }}
        onShareConversation={
          selectedId
            ? () => {
                const url = appConversationUrl(selectedId);
                void navigator.clipboard.writeText(url);
              }
            : undefined
        }
        bulkSelectedIds={bulkSelectedIds}
        bulkSelectionMode={bulkSelectionMode}
        onSelect={handleSelect}
        onToggleBulkSelect={handleToggleBulkSelect}
        onToggleUnread={(id, unread) => void handleToggleUnread(id, unread)}
        onBulkAssign={handleBulkAssign}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
        bulkAssigning={savingAssignment}
        bulkDeleting={savingAssignment}
        onEnterBulkSelectionMode={handleEnterBulkSelectionMode}
        onExitBulkSelectionMode={handleExitBulkSelectionMode}
        onSelectAllBulk={handleSelectAllBulk}
        onClearBulkSelection={handleClearBulkSelection}
        onCreateConversation={() => void handleCreateConversation()}
        creatingConversation={creatingConversation}
        onListHoverStart={pauseListReorder}
        onListHoverEnd={resumeListReorder}
      />
      {selected ? (
        <>
          <ConversationDetail
            key={selected.id}
            conversation={selected}
            messages={messages}
            loading={detailLoading}
            sending={sending}
            hideSendConfirm={inboxCustomize.hideSendConfirm}
            onSend={handleSend}
            onSendNote={handleSendNote}
            onSendReminder={handleSendReminder}
            onCancelReminder={handleCancelReminder}
            onStatusChange={handleStatusChange}
            onAssigneeChange={handleAssigneeChange}
            updatingAssignee={savingAssignment}
            onDeleteNote={handleDeleteNote}
            onUpdateNote={handleUpdateNote}
            onUpdateMessage={handleUpdateMessage}
            deletingNoteId={deletingNoteId}
            updatingNoteId={updatingNoteId}
            updatingMessageId={updatingMessageId}
            cancellingReminderId={cancellingReminderId}
            visitorTyping={visitorTyping}
            messageShortcuts={messageShortcuts}
            onDeleteConversation={() => void handleDeleteConversation()}
            onBlockVisitor={() => void handleBlockVisitor()}
            canBlockVisitor={Boolean(details?.email?.trim())}
            customerPhone={
              details?.visitorData?.find((entry) => entry.key.toLowerCase() === "phone")?.value ??
              null
            }
            onMarkUnread={() => void handleToggleUnread(selected.id, true)}
            onCopyConversationLink={() => {
              const url = appConversationUrl(selected.id);
              void navigator.clipboard.writeText(url);
            }}
            onMarkSpam={() => void handleMarkSpam()}
            onSetSubject={(name) => void handleSetSubject(name)}
            onSendTranscript={() => void handleSendTranscript()}
            onNextConversation={handleNextConversation}
            onPreviousConversation={handlePreviousConversation}
            hasNextConversation={
              conversations.findIndex((c) => c.id === selected.id) < conversations.length - 1
            }
            hasPreviousConversation={conversations.findIndex((c) => c.id === selected.id) > 0}
          />
          <CustomerInfoPanel
            conversation={selected}
            details={details}
            savingEmail={savingEmail}
            savingVisitorData={savingVisitorData}
            savingSegments={savingSegments}
            simulatingVisitor={simulatingVisitor}
            onSaveEmail={handleSaveCustomerEmail}
            onSaveVisitorData={handleSaveVisitorData}
            onRemoveVisitorData={handleRemoveVisitorData}
            onAddSegment={handleAddSegment}
            onRemoveSegment={handleRemoveSegment}
            onSimulateVisitorMessage={handleSimulateVisitorMessage}
          />
        </>
      ) : (
        <ConversationPanel />
      )}
    </div>
  );
}
