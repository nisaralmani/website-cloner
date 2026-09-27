"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiMessage } from "@/lib/inbox/mappers";
import type { Conversation, CustomerDetails, Message } from "@/types/inbox";
import { MARK_UNREAD_COUNT } from "@/lib/inbox/unread";
import { useInboxStream } from "@/hooks/useInboxStream";
import { usePolling } from "@/hooks/usePolling";
import { useInboxCustomizeOptional } from "@/components/providers/InboxCustomizeProvider";
import type { ConversationListSort } from "@/lib/inbox/snapshot";
import { isSnoozedUntilActive } from "@/lib/inbox/snooze-display";
import {
  INBOX_LIST_POLL_MS,
  INBOX_POLL_FALLBACK_MS,
  INBOX_THREAD_POLL_MS,
} from "@/lib/inbox/realtime";

function maxSortOrder(items: ApiMessage[]): number {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), -1);
}

function stripSortOrder({ sortOrder: _sortOrder, ...message }: ApiMessage): Message {
  return message;
}

export function useInboxApp(
  conversationParam: string | null,
  listQuery = "",
  listFilter: {
    segment?: string;
    subInboxId?: string;
    status?: string;
    assignedOperatorId?: string;
  } = {},
  listSort: ConversationListSort = "recent",
) {
  const inboxCustomize = useInboxCustomizeOptional();
  const showSnoozed = inboxCustomize?.showSnoozed ?? false;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const selectedId =
    conversationParam &&
    conversations.some((conversation) => conversation.id === conversationParam)
      ? conversationParam
      : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingVisitorData, setSavingVisitorData] = useState(false);
  const [savingSegments, setSavingSegments] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [simulatingVisitor, setSimulatingVisitor] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [updatingNoteId, setUpdatingNoteId] = useState<string | null>(null);
  const [updatingMessageId, setUpdatingMessageId] = useState<string | null>(null);
  const [cancellingReminderId, setCancellingReminderId] = useState<string | null>(null);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const lastSortOrderRef = useRef(-1);
  const selectedIdRef = useRef(selectedId);
  const lastAutoReadForRef = useRef<string | null>(null);
  const markAsReadRef = useRef<(id: string) => Promise<Conversation | null>>(async () => null);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    setVisitorTyping(false);
  }, [selectedId]);

  const reloadList = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setListLoading(true);
      setListError(null);
    }

    try {
      const params = new URLSearchParams();
      if (showSnoozed) params.set("includeSnoozed", "1");
      const query = listQuery.trim();
      if (query) params.set("q", query);
      if (listFilter.segment) params.set("segment", listFilter.segment);
      if (listFilter.subInboxId) params.set("subInboxId", listFilter.subInboxId);
      if (listFilter.status) params.set("status", listFilter.status);
      if (listFilter.assignedOperatorId) {
        params.set("assignedOperatorId", listFilter.assignedOperatorId);
      }
      if (listSort) params.set("sort", listSort);
      const qs = params.size > 0 ? `?${params.toString()}` : "";
      const response = await fetch(`/api/conversations${qs}`);
      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }
      const data = (await response.json()) as { conversations: Conversation[] };
      setConversations(data.conversations);
      if (!silent) setListError(null);
    } catch {
      if (!silent) {
        setListError("Unable to load conversations.");
        setConversations([]);
      }
    } finally {
      if (!silent) setListLoading(false);
    }
  }, [
    listFilter.assignedOperatorId,
    listFilter.segment,
    listFilter.status,
    listFilter.subInboxId,
    listQuery,
    listSort,
    showSnoozed,
  ]);

  const applyConversationList = useCallback(
    (incoming: Conversation[]) => {
      if (!showSnoozed) {
        setConversations(incoming);
        return;
      }

      setConversations((current) => {
        const incomingIds = new Set(incoming.map((conversation) => conversation.id));
        const snoozedOnly = current.filter(
          (conversation) =>
            isSnoozedUntilActive(conversation.snoozedUntil) &&
            !incomingIds.has(conversation.id),
        );
        return [...incoming, ...snoozedOnly];
      });
    },
    [showSnoozed],
  );

  const applyMessages = useCallback((next: ApiMessage[]) => {
    lastSortOrderRef.current = maxSortOrder(next);
    setMessages(next.map(stripSortOrder));
  }, []);

  const appendMessages = useCallback((incoming: ApiMessage[]) => {
    if (incoming.length === 0) return;
    lastSortOrderRef.current = maxSortOrder(incoming);
    setMessages((current) => {
      const seen = new Set(current.map((message) => message.id));
      const merged = [...current];
      for (const item of incoming) {
        if (seen.has(item.id)) continue;
        merged.push(stripSortOrder(item));
        seen.add(item.id);
      }
      return merged;
    });
  }, []);

  const patchMessage = useCallback((updated: ApiMessage) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === updated.id ? stripSortOrder(updated) : message,
      ),
    );
  }, []);

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setDetails(null);
      setDetailLoading(false);
      setDetailError(null);
      lastSortOrderRef.current = -1;
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    lastSortOrderRef.current = -1;

    void (async () => {
      try {
        const response = await fetch(`/api/conversations/${selectedId}`);
        if (!response.ok) {
          throw new Error("Failed to load conversation");
        }
        const data = (await response.json()) as {
          messages: ApiMessage[];
          details: CustomerDetails;
        };
        if (!cancelled) {
          applyMessages(data.messages);
          setDetails(data.details);
        }
      } catch {
        if (!cancelled) {
          setDetailError("Unable to load conversation.");
          setMessages([]);
          setDetails(null);
          lastSortOrderRef.current = -1;
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyMessages, selectedId]);

  const pollMessages = useCallback(async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(
        `/api/conversations/${selectedId}/messages?after=${lastSortOrderRef.current}`,
      );
      if (!response.ok) return;

      const data = (await response.json()) as { messages: ApiMessage[] };
      appendMessages(data.messages);
    } catch {
      // Silent poll fallback.
    }
  }, [appendMessages, selectedId]);

  const applyReceipt = useCallback(
    (messageId: string, deliveredAt?: string | null, readAt?: string | null) => {
      setMessages((current) =>
        current.map((message) => {
          if (message.id !== messageId) return message;
          return {
            ...message,
            ...(deliveredAt ? { deliveredAt } : {}),
            ...(readAt ? { readAt } : {}),
          };
        }),
      );
    },
    [],
  );

  const { connected } = useInboxStream({
    enabled: !listLoading,
    conversationId: selectedId,
    includeSnoozed: showSnoozed,
    onConversations: applyConversationList,
    onMessages: (conversationId, incoming) => {
      if (conversationId === selectedIdRef.current) {
        appendMessages(incoming);
        if (incoming.some((message) => message.from === "visitor")) {
          setVisitorTyping(false);
          void markAsReadRef.current(conversationId);
        }
      }
    },
    onTyping: (conversationId, from, typing) => {
      if (conversationId === selectedIdRef.current && from === "visitor") {
        setVisitorTyping(typing);
      }
    },
    onReceipt: (conversationId, messageId, deliveredAt, readAt) => {
      if (conversationId === selectedIdRef.current) {
        applyReceipt(messageId, deliveredAt, readAt);
      }
    },
  });

  usePolling(
    () => reloadList({ silent: true }),
    connected ? INBOX_POLL_FALLBACK_MS : INBOX_LIST_POLL_MS,
    !listLoading,
  );

  usePolling(
    pollMessages,
    connected ? INBOX_POLL_FALLBACK_MS : INBOX_THREAD_POLL_MS,
    Boolean(selectedId) && !detailLoading,
  );

  const applyConversationPatch = useCallback((conversation: Conversation) => {
    setConversations((current) =>
      current.map((item) => (item.id === conversation.id ? conversation : item)),
    );
  }, []);

  const setUnread = useCallback(
    async (id: string, unread: number) => {
      try {
        const response = await fetch(`/api/conversations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unread }),
        });

        if (!response.ok) {
          throw new Error("Failed to update unread count");
        }

        const data = (await response.json()) as { conversation: Conversation };
        applyConversationPatch(data.conversation);
        return data.conversation;
      } catch {
        setDetailError("Unable to update unread count.");
        return null;
      }
    },
    [applyConversationPatch],
  );

  const markAsRead = useCallback(
    async (id: string) => setUnread(id, 0),
    [setUnread],
  );
  markAsReadRef.current = markAsRead;

  const markAsUnread = useCallback(
    async (id: string) => setUnread(id, MARK_UNREAD_COUNT),
    [setUnread],
  );

  const toggleUnread = useCallback(
    async (id: string, unread: boolean) =>
      setUnread(id, unread ? MARK_UNREAD_COUNT : 0),
    [setUnread],
  );

  const updateCustomerEmail = useCallback(
    async (id: string, email: string | null) => {
      setSavingEmail(true);
      try {
        const response = await fetch(`/api/conversations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerEmail: email }),
        });

        if (!response.ok) {
          throw new Error("Failed to update customer email");
        }

        const data = (await response.json()) as {
          conversation: Conversation;
          details: CustomerDetails;
        };

        applyConversationPatch(data.conversation);
        if (id === selectedIdRef.current) {
          setDetails(data.details);
        }
        return true;
      } catch {
        setDetailError("Unable to update customer email.");
        return false;
      } finally {
        setSavingEmail(false);
      }
    },
    [applyConversationPatch],
  );

  const updateAssignedOperator = useCallback(
    async (id: string, assignedOperatorId: string | null) => {
      setSavingAssignment(true);
      try {
        const response = await fetch(`/api/conversations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedOperatorId }),
        });

        if (!response.ok) {
          throw new Error("Failed to update conversation assignment");
        }

        const data = (await response.json()) as {
          conversation: Conversation;
          details: CustomerDetails;
        };

        applyConversationPatch(data.conversation);
        if (id === selectedIdRef.current) {
          setDetails(data.details);
        }
        return data.conversation;
      } catch {
        setDetailError("Unable to update conversation assignment.");
        return null;
      } finally {
        setSavingAssignment(false);
      }
    },
    [applyConversationPatch],
  );

  const bulkAssignConversations = useCallback(
    async (conversationIds: string[], assignedOperatorId: string | null) => {
      setSavingAssignment(true);
      try {
        const response = await fetch("/api/conversations/bulk-assign", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationIds, assignedOperatorId }),
        });

        if (!response.ok) {
          throw new Error("Failed to bulk assign conversations");
        }

        const data = (await response.json()) as {
          updatedCount: number;
          conversations: Conversation[];
        };

        for (const conversation of data.conversations) {
          applyConversationPatch(conversation);
        }

        return data.conversations;
      } catch {
        setListError("Unable to bulk assign conversations.");
        return null;
      } finally {
        setSavingAssignment(false);
      }
    },
    [applyConversationPatch],
  );

  const bulkDeleteConversations = useCallback(
    async (conversationIds: string[]) => {
      setSavingAssignment(true);
      try {
        const response = await fetch("/api/conversations/bulk-delete", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to bulk delete conversations");
        }

        const data = (await response.json()) as { deletedIds: string[] };
        setConversations((current) =>
          current.filter((conversation) => !data.deletedIds.includes(conversation.id)),
        );

        if (selectedIdRef.current && data.deletedIds.includes(selectedIdRef.current)) {
          setMessages([]);
          setDetails(null);
        }

        return data.deletedIds;
      } catch {
        setListError("Unable to bulk delete conversations.");
        return null;
      } finally {
        setSavingAssignment(false);
      }
    },
    [],
  );

  const bulkUpdateConversationStatus = useCallback(
    async (conversationIds: string[], status: Conversation["status"]) => {
      setSavingAssignment(true);
      try {
        const response = await fetch("/api/conversations/bulk-status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationIds, status }),
        });

        if (!response.ok) {
          throw new Error("Failed to bulk update conversation status");
        }

        const data = (await response.json()) as { conversations: Conversation[] };
        for (const conversation of data.conversations) {
          applyConversationPatch(conversation);
        }
        return data.conversations;
      } catch {
        setListError("Unable to bulk update conversation status.");
        return null;
      } finally {
        setSavingAssignment(false);
      }
    },
    [applyConversationPatch],
  );

  const upsertVisitorData = useCallback(
    async (id: string, key: string, value: string) => {
      setSavingVisitorData(true);
      try {
        const response = await fetch(`/api/conversations/${id}/visitor-data`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });

        if (!response.ok) {
          throw new Error("Failed to save visitor data");
        }

        const data = (await response.json()) as {
          conversation: Conversation;
          details: CustomerDetails;
        };

        applyConversationPatch(data.conversation);
        if (id === selectedIdRef.current) {
          setDetails(data.details);
        }
        return true;
      } catch {
        setDetailError("Unable to save visitor data.");
        return false;
      } finally {
        setSavingVisitorData(false);
      }
    },
    [applyConversationPatch],
  );

  const removeVisitorData = useCallback(
    async (id: string, key: string) => {
      setSavingVisitorData(true);
      try {
        const response = await fetch(`/api/conversations/${id}/visitor-data`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove visitor data");
        }

        const data = (await response.json()) as {
          conversation: Conversation;
          details: CustomerDetails;
        };

        applyConversationPatch(data.conversation);
        if (id === selectedIdRef.current) {
          setDetails(data.details);
        }
        return true;
      } catch {
        setDetailError("Unable to remove visitor data.");
        return false;
      } finally {
        setSavingVisitorData(false);
      }
    },
    [applyConversationPatch],
  );

  const addConversationSegment = useCallback(
    async (id: string, segment: string) => {
      setSavingSegments(true);
      try {
        const response = await fetch(`/api/conversations/${id}/segments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segment }),
        });

        if (!response.ok) {
          throw new Error("Failed to add conversation segment");
        }

        const data = (await response.json()) as {
          conversation: Conversation;
          details: CustomerDetails;
        };

        applyConversationPatch(data.conversation);
        if (id === selectedIdRef.current) {
          setDetails(data.details);
        }
        return true;
      } catch {
        setDetailError("Unable to add conversation segment.");
        return false;
      } finally {
        setSavingSegments(false);
      }
    },
    [applyConversationPatch],
  );

  const removeConversationSegment = useCallback(
    async (id: string, segment: string) => {
      setSavingSegments(true);
      try {
        const response = await fetch(`/api/conversations/${id}/segments`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segment }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove conversation segment");
        }

        const data = (await response.json()) as {
          conversation: Conversation;
          details: CustomerDetails;
        };

        applyConversationPatch(data.conversation);
        if (id === selectedIdRef.current) {
          setDetails(data.details);
        }
        return true;
      } catch {
        setDetailError("Unable to remove conversation segment.");
        return false;
      } finally {
        setSavingSegments(false);
      }
    },
    [applyConversationPatch],
  );

  useEffect(() => {
    if (!selectedId) {
      lastAutoReadForRef.current = null;
      return;
    }

    if (lastAutoReadForRef.current === selectedId) return;

    const conversation = conversations.find((item) => item.id === selectedId);
    if (!conversation) return;

    lastAutoReadForRef.current = selectedId;
    if (conversation.unread > 0) {
      void markAsRead(selectedId);
    }
  }, [selectedId, conversations, markAsRead]);

  const sendMessage = useCallback(
    async (text: string, file?: File) => {
      if (!selectedId) return null;

      const trimmed = text.trim();
      if (!trimmed && !file) return null;

      setSending(true);
      try {
        let response: Response;

        if (file) {
          const form = new FormData();
          form.append("file", file);
          if (trimmed) {
            form.append("text", trimmed);
          }
          response = await fetch(`/api/conversations/${selectedId}/messages`, {
            method: "POST",
            body: form,
          });
        } else {
          response = await fetch(`/api/conversations/${selectedId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmed }),
          });
        }

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data = (await response.json()) as { message: ApiMessage };
        appendMessages([data.message]);
        return data.message;
      } catch {
        setDetailError("Unable to send message.");
        return null;
      } finally {
        setSending(false);
      }
    },
    [appendMessages, selectedId],
  );

  const simulateVisitorMessage = useCallback(
    async (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return null;

      setSimulatingVisitor(true);
      try {
        const response = await fetch(`/api/conversations/${id}/visitor-messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });

        if (!response.ok) {
          throw new Error("Failed to simulate visitor message");
        }

        const data = (await response.json()) as {
          message: ApiMessage;
          conversation: Conversation | null;
        };

        if (id === selectedIdRef.current) {
          appendMessages([data.message]);
        }
        if (data.conversation) {
          applyConversationPatch(data.conversation);
        }
        return data.message;
      } catch {
        setDetailError("Unable to simulate visitor message.");
        return null;
      } finally {
        setSimulatingVisitor(false);
      }
    },
    [appendMessages, applyConversationPatch],
  );

  const sendNote = useCallback(
    async (text: string) => {
      if (!selectedId) return null;

      const trimmed = text.trim();
      if (!trimmed) return null;

      setSending(true);
      try {
        const response = await fetch(`/api/conversations/${selectedId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });

        if (!response.ok) {
          throw new Error("Failed to save note");
        }

        const data = (await response.json()) as { message: ApiMessage };
        appendMessages([data.message]);
        return data.message;
      } catch {
        setDetailError("Unable to save note.");
        return null;
      } finally {
        setSending(false);
      }
    },
    [appendMessages, selectedId],
  );

  const sendReminder = useCallback(
    async (note: string, remindAt: string) => {
      if (!selectedId) return null;

      setSending(true);
      try {
        const response = await fetch(`/api/conversations/${selectedId}/reminders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note, remindAt }),
        });

        if (!response.ok) {
          throw new Error("Failed to save reminder");
        }

        const data = (await response.json()) as { message: ApiMessage };
        appendMessages([data.message]);
        return data.message;
      } catch {
        setDetailError("Unable to save reminder.");
        return null;
      } finally {
        setSending(false);
      }
    },
    [appendMessages, selectedId],
  );

  const cancelReminder = useCallback(
    async (conversationId: string, reminderId: string) => {
      setCancellingReminderId(reminderId);
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/reminders/${reminderId}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          throw new Error("Failed to cancel reminder");
        }

        if (conversationId === selectedIdRef.current) {
          setMessages((current) =>
            current.map((message) =>
              message.reminderId === reminderId
                ? { ...message, remindAt: undefined, reminderId: undefined }
                : message,
            ),
          );
        }
        return true;
      } catch {
        setDetailError("Unable to cancel reminder.");
        return false;
      } finally {
        setCancellingReminderId(null);
      }
    },
    [],
  );

  const deleteNote = useCallback(
    async (conversationId: string, messageId: string) => {
      setDeletingNoteId(messageId);
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/notes/${messageId}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          throw new Error("Failed to delete note");
        }

        const data = (await response.json()) as {
          messageId: string;
          conversation: Conversation;
        };

        if (conversationId === selectedIdRef.current) {
          setMessages((current) => current.filter((message) => message.id !== messageId));
        }
        applyConversationPatch(data.conversation);
        return true;
      } catch {
        setDetailError("Unable to delete note.");
        return false;
      } finally {
        setDeletingNoteId(null);
      }
    },
    [applyConversationPatch],
  );

  const updateNote = useCallback(
    async (conversationId: string, messageId: string, text: string) => {
      setUpdatingNoteId(messageId);
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/notes/${messageId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to update note");
        }

        const data = (await response.json()) as {
          message: ApiMessage;
          conversation: Conversation;
        };

        if (conversationId === selectedIdRef.current) {
          patchMessage(data.message);
        }
        applyConversationPatch(data.conversation);
        return true;
      } catch {
        setDetailError("Unable to update note.");
        return false;
      } finally {
        setUpdatingNoteId(null);
      }
    },
    [applyConversationPatch, patchMessage],
  );

  const updateMessage = useCallback(
    async (conversationId: string, messageId: string, text: string) => {
      setUpdatingMessageId(messageId);
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/messages/${messageId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to update message");
        }

        const data = (await response.json()) as {
          message: ApiMessage;
          conversation: Conversation;
        };

        if (conversationId === selectedIdRef.current) {
          patchMessage(data.message);
        }
        applyConversationPatch(data.conversation);
        return true;
      } catch {
        setDetailError("Unable to update message.");
        return false;
      } finally {
        setUpdatingMessageId(null);
      }
    },
    [applyConversationPatch, patchMessage],
  );

  const updateStatus = useCallback(
    async (status: Conversation["status"]) => {
      if (!selectedId) return null;

      try {
        const response = await fetch(`/api/conversations/${selectedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          throw new Error("Failed to update conversation status");
        }

        const data = (await response.json()) as { conversation: Conversation };
        applyConversationPatch(data.conversation);
        return data.conversation;
      } catch {
        setDetailError("Unable to update conversation status.");
        return null;
      }
    },
    [applyConversationPatch, selectedId],
  );

  const deleteConversationById = useCallback(
    async (conversationId: string) => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete conversation");
        }
        setConversations((current) =>
          current.filter((conversation) => conversation.id !== conversationId),
        );
        if (conversationId === selectedIdRef.current) {
          setMessages([]);
          setDetails(null);
        }
        return true;
      } catch {
        setDetailError("Unable to delete conversation.");
        return false;
      }
    },
    [],
  );

  const createConversation = useCallback(async (name?: string) => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(name ? { name } : {}),
      });
      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }
      const data = (await response.json()) as { conversation: Conversation };
      setConversations((current) => [data.conversation, ...current]);
      return data.conversation;
    } catch {
      setListError("Unable to create conversation.");
      return null;
    }
  }, []);

  return {
    conversations,
    listLoading,
    listError,
    reloadList,
    selectedId,
    messages,
    details,
    detailLoading,
    detailError,
    sending,
    sendMessage,
    simulateVisitorMessage,
    sendNote,
    sendReminder,
    deleteNote,
    updateNote,
    updateMessage,
    cancelReminder,
    setUnread,
    markAsRead,
    markAsUnread,
    toggleUnread,
    updateCustomerEmail,
    upsertVisitorData,
    removeVisitorData,
    addConversationSegment,
    removeConversationSegment,
    updateAssignedOperator,
    bulkAssignConversations,
    bulkDeleteConversations,
    bulkUpdateConversationStatus,
    updateStatus,
    deleteConversationById,
    createConversation,
    streamConnected: connected,
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
  };
}
