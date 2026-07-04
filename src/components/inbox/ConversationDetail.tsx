"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import {
  Phone,
  Video,
  Ban,
  MoreHorizontal,
  ArrowRight,
  ChevronDown,
  Paperclip,
  Smile,
  Send,
  Check,
  CheckCheck,
  Bot,
} from "lucide-react";

import AiTimeline from "@/components/agent/AiTimeline";
import { cn } from "@/lib/utils";
import type { Conversation, ConversationStatus, Message } from "@/types/inbox";
import type { MessageShortcut } from "@/types/message-shortcuts";
import { PersonGlyph } from "@/components/icons";
import { AssigneePicker } from "@/components/inbox/AssigneePicker";
import { NoteMessageBubble } from "@/components/inbox/NoteMessageBubble";
import { ReminderMessageBubble } from "@/components/inbox/ReminderMessageBubble";
import { conversationStatusLabel } from "@/lib/inbox/conversation-status";
import { useSession } from "@/components/providers/SessionProvider";
import { useTypingPing } from "@/hooks/useTypingPing";
import { MessageAttachmentPreview } from "@/components/inbox/MessageAttachmentPreview";

interface ConversationDetailProps {
  conversation: Conversation;
  messages: Message[];
  loading?: boolean;
  sending?: boolean;
  updatingStatus?: boolean;
  updatingAssignee?: boolean;
  hideSendConfirm?: boolean;
  onSend?: (text: string, file?: File) => Promise<unknown>;
  onSendNote?: (text: string) => Promise<unknown>;
  onSendReminder?: (note: string, remindAt: string) => Promise<unknown>;
  onCancelReminder?: (reminderId: string) => Promise<unknown>;
  onStatusChange?: (status: ConversationStatus) => Promise<unknown>;
  onAssigneeChange?: (assignedOperatorId: string | null) => Promise<unknown>;
  onDeleteNote?: (messageId: string) => Promise<unknown>;
  onUpdateNote?: (messageId: string, text: string) => Promise<boolean>;
  onUpdateMessage?: (messageId: string, text: string) => Promise<boolean>;
  deletingNoteId?: string | null;
  updatingNoteId?: string | null;
  updatingMessageId?: string | null;
  cancellingReminderId?: string | null;
  visitorTyping?: boolean;
  messageShortcuts?: MessageShortcut[];
  onDeleteConversation?: () => void;
  onBlockVisitor?: () => void;
  canBlockVisitor?: boolean;
  customerPhone?: string | null;
  onMarkUnread?: () => void | Promise<unknown>;
  onCopyConversationLink?: () => void;
}

const COMPOSER_TABS = [
  "Reply",
  "Edit",
  "Note",
  "Reminder",
  "Shortcuts",
  "Knowledge Base",
] as const;

type ActiveComposerTab = "Reply" | "Edit" | "Note" | "Reminder" | "Shortcuts" | "Knowledge Base";

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultRemindAtValue() {
  return toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));
}

const STATUS_OPTIONS: ConversationStatus[] = ["pending", "resolved", "unassigned"];

function statusButtonClass(status: ConversationStatus) {
  if (status === "pending") {
    return "bg-[#1972F5] text-white";
  }
  if (status === "resolved") {
    return "bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]";
  }
  return "bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]";
}

export default function ConversationDetail({
  conversation,
  messages,
  loading = false,
  sending = false,
  updatingStatus = false,
  updatingAssignee = false,
  hideSendConfirm = false,
  onSend,
  onSendNote,
  onSendReminder,
  onCancelReminder,
  onStatusChange,
  onAssigneeChange,
  onDeleteNote,
  onUpdateNote,
  onUpdateMessage,
  deletingNoteId = null,
  updatingNoteId = null,
  updatingMessageId = null,
  cancellingReminderId = null,
  visitorTyping = false,
  messageShortcuts = [],
  onDeleteConversation,
  onBlockVisitor,
  canBlockVisitor = false,
  customerPhone = null,
  onMarkUnread,
  onCopyConversationLink,
}: ConversationDetailProps) {
  const { user: sessionUser } = useSession();
  const [message, setMessage] = useState("");
  const [remindAt, setRemindAt] = useState(defaultRemindAtValue);
  const [composerTab, setComposerTab] = useState<ActiveComposerTab>("Reply");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [composerMoreOpen, setComposerMoreOpen] = useState(false);
  const [composerTabsOpen, setComposerTabsOpen] = useState(false);
  const [liveTranslateActive, setLiveTranslateActive] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [helpArticles, setHelpArticles] = useState<{ id: string; title: string }[]>([]);
  const [helpArticlesLoading, setHelpArticlesLoading] = useState(false);
  const [aiTimelineOpen, setAiTimelineOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const composerMoreRef = useRef<HTMLDivElement>(null);
  const composerTabsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { notifyTyping, stopTyping } = useTypingPing({
    url: `/api/conversations/${conversation.id}/typing`,
    enabled: composerTab === "Reply",
  });

  const isNoteMode = composerTab === "Note";
  const isEditMode = composerTab === "Edit";
  const isReminderMode = composerTab === "Reminder";
  const isShortcutsMode = composerTab === "Shortcuts";
  const isKnowledgeBaseMode = composerTab === "Knowledge Base";
  const lastEditableMessage = [...messages]
    .reverse()
    .find((entry) => entry.from === "operator" && !entry.attachment);
  const canSend = message.trim().length > 0 && !sending && !updatingMessageId;
  const canSendReminder = Boolean(remindAt) && !sending;

  useEffect(() => {
    if (!statusMenuOpen && !moreMenuOpen && !composerMoreOpen && !composerTabsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (statusMenuOpen && !statusMenuRef.current?.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
      if (moreMenuOpen && !moreMenuRef.current?.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (composerMoreOpen && !composerMoreRef.current?.contains(event.target as Node)) {
        setComposerMoreOpen(false);
      }
      if (composerTabsOpen && !composerTabsRef.current?.contains(event.target as Node)) {
        setComposerTabsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [composerMoreOpen, composerTabsOpen, moreMenuOpen, statusMenuOpen]);

  useEffect(() => {
    if (!isKnowledgeBaseMode) return;

    let cancelled = false;
    setHelpArticlesLoading(true);

    void (async () => {
      try {
        const response = await fetch("/api/helpdesk");
        if (!response.ok) throw new Error("Failed to load articles");
        const payload = (await response.json()) as {
          articles?: { id: string; title: string }[];
        };
        if (!cancelled) {
          setHelpArticles(payload.articles ?? []);
        }
      } catch {
        if (!cancelled) setHelpArticles([]);
      } finally {
        if (!cancelled) setHelpArticlesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isKnowledgeBaseMode]);

  const handleSend = async () => {
    if (!canSend) return;
    const text = message.trim();

    if (isEditMode) {
      if (!onUpdateMessage || !editingMessageId) return;
      const saved = await onUpdateMessage(editingMessageId, text);
      if (saved) {
        setMessage("");
        setEditingMessageId(null);
        setComposerTab("Reply");
      }
      return;
    }

    if (isNoteMode) {
      if (!onSendNote) return;
      setMessage("");
      await onSendNote(text);
      return;
    }

    if (isReminderMode) {
      if (!onSendReminder || !remindAt) return;
      const note = text || "Follow-up reminder";
      setMessage("");
      setRemindAt(defaultRemindAtValue());
      await onSendReminder(note, new Date(remindAt).toISOString());
      return;
    }

    if (!onSend) return;
    if (!hideSendConfirm) {
      const confirmed = window.confirm(`Send this message to ${conversation.name}?`);
      if (!confirmed) return;
    }
    stopTyping();
    setMessage("");
    await onSend(text);
  };

  const handleFileUpload = async (file: File) => {
    if (!onSend || sending || isNoteMode || isReminderMode) return;

    stopTyping();
    const caption = message.trim();
    setMessage("");
    await onSend(caption, file);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleStatusSelect = async (status: ConversationStatus) => {
    setStatusMenuOpen(false);
    if (status === conversation.status || !onStatusChange) return;
    await onStatusChange(status);
  };

  const phoneHref = customerPhone ? `tel:${customerPhone.replace(/\s+/g, "")}` : null;

  const selectComposerTab = (tab: (typeof COMPOSER_TABS)[number]) => {
    setComposerTabsOpen(false);
    if (tab === "Reply") {
      setEditingMessageId(null);
      setMessage("");
      setComposerTab("Reply");
      return;
    }
    if (tab === "Edit" && lastEditableMessage) {
      setEditingMessageId(lastEditableMessage.id);
      setMessage(lastEditableMessage.text);
      setComposerTab("Edit");
      return;
    }
    if (tab === "Note") setComposerTab("Note");
    if (tab === "Reminder") setComposerTab("Reminder");
    if (tab === "Shortcuts") setComposerTab("Shortcuts");
    if (tab === "Knowledge Base") setComposerTab("Knowledge Base");
  };

  const insertAtCursor = (inserted: string) => {
    const element = textareaRef.current;
    if (!element) {
      setMessage((current) => current + inserted);
      return;
    }
    const start = element.selectionStart;
    const end = element.selectionEnd;
    setMessage((current) => current.slice(0, start) + inserted + current.slice(end));
    requestAnimationFrame(() => {
      element.focus();
      const nextPosition = start + inserted.length;
      element.setSelectionRange(nextPosition, nextPosition);
    });
  };

  const handleWrapBold = () => {
    const element = textareaRef.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = message.slice(start, end) || "text";
    const wrapped = `**${selected}**`;
    setMessage(message.slice(0, start) + wrapped + message.slice(end));
  };

  const handleInsertShortcut = (text: string) => {
    setComposerMoreOpen(false);
    setComposerTab("Reply");
    insertAtCursor(text);
  };

  return (
    <div className="relative flex flex-col h-full flex-1 min-w-0 bg-white">
      {/* 1. Header bar */}
      <div className="h-[52px] shrink-0 border-b border-[#E6EAF0] px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!phoneHref}
            onClick={() => {
              if (phoneHref) window.location.href = phoneHref;
            }}
            className="text-[#828EA1] hover:text-[#2C405A] disabled:opacity-40"
            aria-label="Call visitor"
          >
            <Phone size={18} />
          </button>
          <button
            type="button"
            disabled={!phoneHref}
            onClick={() => {
              window.open("https://meet.google.com/new", "_blank", "noopener,noreferrer");
            }}
            className="text-[#828EA1] hover:text-[#2C405A] disabled:opacity-40"
            aria-label="Start video call"
          >
            <Video size={18} />
          </button>
          <button
            type="button"
            disabled={!canBlockVisitor}
            onClick={onBlockVisitor}
            className="text-[#828EA1] hover:text-[#2C405A] disabled:opacity-40"
            aria-label="Block visitor"
          >
            <Ban size={18} />
          </button>
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen((open) => !open)}
              className="text-[#828EA1] hover:text-[#2C405A]"
              aria-label="More actions"
            >
              <MoreHorizontal size={18} />
            </button>
            {moreMenuOpen ? (
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-[#E6EAF0] bg-white py-1 shadow-lg">
                {onMarkUnread ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      void onMarkUnread();
                    }}
                    className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#2C405A] hover:bg-[#F9FAFB]"
                  >
                    Mark as unread
                  </button>
                ) : null}
                {onCopyConversationLink ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onCopyConversationLink();
                    }}
                    className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#2C405A] hover:bg-[#F9FAFB]"
                  >
                    Copy conversation link
                  </button>
                ) : null}
                {onDeleteConversation ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onDeleteConversation();
                    }}
                    className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#EF4444] hover:bg-[#F9FAFB]"
                  >
                    Delete conversation
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAiTimelineOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E6EAF0] bg-white px-3 text-xs font-bold text-[#5D6B98] hover:bg-[#F9FAFB]"
            aria-label="View AI Timeline"
          >
            <Bot size={14} className="text-[#1972F5]" />
            AI Timeline
          </button>
          <AssigneePicker
            conversation={conversation}
            updating={updatingAssignee}
            onAssigneeChange={onAssigneeChange}
          />
          <div className="relative" ref={statusMenuRef}>
          <button
            type="button"
            disabled={updatingStatus || !onStatusChange}
            onClick={() => setStatusMenuOpen((open) => !open)}
            className={cn(
              "rounded-lg h-9 px-3 inline-flex items-center gap-1.5 text-xs font-bold disabled:opacity-60",
              statusButtonClass(conversation.status),
            )}
          >
            {conversation.status === "pending" ? <ArrowRight size={14} /> : <Check size={14} />}
            {conversationStatusLabel(conversation.status)}
            <ChevronDown size={14} />
          </button>
          {statusMenuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[148px] rounded-lg border border-[#E6EAF0] bg-white py-1 shadow-lg">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => void handleStatusSelect(status)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#F4F6FB]",
                    status === conversation.status
                      ? "font-semibold text-[#1972F5]"
                      : "text-[#2C405A]",
                  )}
                >
                  {conversationStatusLabel(status)}
                  {status === conversation.status && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* 2. Thread */}
      <div className="flex-1 overflow-y-auto bg-white px-6 py-5 flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setLiveTranslateActive((active) => !active)}
          className={cn(
            "self-center inline-flex border rounded-full px-3 py-1 text-xs font-semibold",
            liveTranslateActive
              ? "border-[#1972F5] bg-[#EBF3FE] text-[#1972F5]"
              : "border-[#E6EAF0] text-[#5D6B98] hover:border-[#1972F5] hover:text-[#1972F5]",
          )}
        >
          {liveTranslateActive ? "LiveTranslate active" : "Start LiveTranslate"}
        </button>

        <span className="text-xs text-[#828EA1] self-center">5 February</span>

        {loading ? (
          <p className="text-center text-sm text-[#828EA1]">Loading messages…</p>
        ) : (
          messages.map((m) => {
            if (m.from === "note") {
              const isNoteAuthor = Boolean(sessionUser?.id && m.author?.id === sessionUser.id);

              return (
                <NoteMessageBubble
                  key={m.id}
                  message={m}
                  deleting={deletingNoteId === m.id}
                  updating={updatingNoteId === m.id}
                  onDelete={isNoteAuthor ? onDeleteNote : undefined}
                  onUpdate={isNoteAuthor ? onUpdateNote : undefined}
                />
              );
            }

            if (m.from === "reminder") {
              const isReminderAuthor = Boolean(sessionUser?.id && m.author?.id === sessionUser.id);

              return (
                <ReminderMessageBubble
                  key={m.id}
                  message={m}
                  cancelling={cancellingReminderId === m.reminderId}
                  onCancel={isReminderAuthor ? onCancelReminder : undefined}
                />
              );
            }

            if (m.from === "visitor") {
              return (
                <div key={m.id} className="flex flex-col items-start gap-1">
                  <div className="flex items-end gap-2 justify-start max-w-[72%]">
                    <div
                      className={cn(
                        "h-7 w-7 shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center text-white",
                        conversation.avatarGradient,
                      )}
                    >
                      <PersonGlyph size={14} />
                    </div>
                    <div className="space-y-2 bg-[#F4F4F5] text-[#2C405A] text-sm rounded-2xl rounded-bl-sm px-4 py-2.5">
                      {m.attachment && <MessageAttachmentPreview attachment={m.attachment} />}
                      {m.text && !(m.attachment && m.text.startsWith("📎 ")) ? (
                        <p>{m.text}</p>
                      ) : null}
                      {!m.attachment && m.text ? <p>{m.text}</p> : null}
                    </div>
                  </div>
                  <span className="pl-9 text-[11px] text-[#828EA1]">{m.time}</span>
                </div>
              );
            }

            return (
              <div key={m.id} className="flex flex-col items-end gap-1">
                <div className="max-w-[72%] space-y-2 rounded-2xl rounded-br-sm bg-[#1972F5] px-4 py-2.5 text-sm text-white">
                  {m.attachment && (
                    <MessageAttachmentPreview attachment={m.attachment} variant="widget" />
                  )}
                  {m.text && !(m.attachment && m.text.startsWith("📎 ")) ? <p>{m.text}</p> : null}
                  {!m.attachment && m.text ? <p>{m.text}</p> : null}
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#828EA1]">
                  {m.time}
                  {m.readAt ? (
                    <CheckCheck size={12} className="text-[#1972F5]" aria-label="Read" />
                  ) : m.deliveredAt ? (
                    <Check size={12} aria-label="Delivered" />
                  ) : null}
                </span>
              </div>
            );
          })
        )}

        {visitorTyping && (
          <div className="flex items-end gap-2 justify-start max-w-[72%]">
            <div
              className={cn(
                "h-7 w-7 shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center text-white",
                conversation.avatarGradient,
              )}
            >
              <PersonGlyph size={14} />
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-[#F4F4F5] px-4 py-3 text-sm text-[#828EA1]">
              {conversation.name} is typing…
            </div>
          </div>
        )}
      </div>

      {/* 3. Composer */}
      <div
        className={cn(
          "m-4 mt-0 shrink-0 rounded-xl border bg-white shadow-sm overflow-hidden",
          isNoteMode ? "border-[#FACA00]" : isReminderMode ? "border-[#C4B5FD]" : "border-[#E6EAF0]",
        )}
      >
        {/* Tab row */}
        <div className="flex items-center gap-5 px-4 border-b border-[#E6EAF0] h-10 text-sm">
          {COMPOSER_TABS.map((tab) => {
            const isReply = tab === "Reply";
            const isEdit = tab === "Edit";
            const isNote = tab === "Note";
            const isReminder = tab === "Reminder";
            const isShortcuts = tab === "Shortcuts";
            const isKnowledgeBase = tab === "Knowledge Base";
            const clickable =
              isReply ||
              isEdit ||
              isNote ||
              isReminder ||
              isShortcuts ||
              isKnowledgeBase;

            return (
              <button
                key={tab}
                type="button"
                disabled={!clickable || (isEdit && !lastEditableMessage)}
                onClick={() => selectComposerTab(tab)}
                className={cn(
                  "py-2.5",
                  (isReply && composerTab === "Reply") ||
                    (isEdit && composerTab === "Edit") ||
                    (isNote && composerTab === "Note") ||
                    (isReminder && composerTab === "Reminder") ||
                    (isShortcuts && composerTab === "Shortcuts") ||
                    (isKnowledgeBase && composerTab === "Knowledge Base")
                    ? isNoteMode && isNote
                      ? "font-semibold border-b-2 border-[#FACA00] text-[#9A7B00]"
                      : isEditMode && isEdit
                        ? "font-semibold border-b-2 border-[#1972F5] text-[#1972F5]"
                      : isReminderMode && isReminder
                        ? "font-semibold border-b-2 border-[#8B5CF6] text-[#6D28D9]"
                        : isShortcutsMode && isShortcuts
                          ? "font-semibold border-b-2 border-[#1972F5] text-[#1972F5]"
                          : isKnowledgeBaseMode && isKnowledgeBase
                            ? "font-semibold border-b-2 border-[#1972F5] text-[#1972F5]"
                          : "text-[#1972F5] font-semibold border-b-2 border-[#1972F5]"
                    : "text-[#828EA1]",
                  (!clickable || (isEdit && !lastEditableMessage)) && "cursor-default opacity-60",
                )}
              >
                {tab}
              </button>
            );
          })}
          <div ref={composerTabsRef} className="relative ml-auto">
            <button
              type="button"
              aria-label="Composer tabs menu"
              onClick={() => setComposerTabsOpen((open) => !open)}
              className="inline-flex items-center text-[#828EA1] hover:text-[#2C405A]"
            >
              <ChevronDown size={16} />
            </button>
            {composerTabsOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-[#E6EAF0] bg-white py-1 shadow-lg">
                {COMPOSER_TABS.map((tab) => {
                  const isEdit = tab === "Edit";
                  const disabled = isEdit && !lastEditableMessage;
                  return (
                    <button
                      key={tab}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectComposerTab(tab)}
                      className={cn(
                        "block w-full px-3 py-2 text-left text-sm font-semibold hover:bg-[#F4F6FB]",
                        composerTab === tab ? "text-[#1972F5]" : "text-[#2C405A]",
                        disabled && "cursor-default opacity-50",
                      )}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Input row */}
        {isReminderMode && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E6EAF0] px-4 py-2">
            <input
              type="datetime-local"
              value={remindAt}
              onChange={(event) => setRemindAt(event.target.value)}
              className="rounded-md border border-[#C4B5FD] px-2 py-1 text-sm text-[#2C405A] outline-none focus:border-[#8B5CF6]"
            />
            {[
              { label: "1 hour", ms: 60 * 60 * 1000 },
              { label: "Tomorrow", ms: 24 * 60 * 60 * 1000 },
              { label: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setRemindAt(toDateTimeLocalValue(new Date(Date.now() + preset.ms)))}
                className="rounded-full bg-[#EDE9FE] px-2.5 py-1 text-xs font-semibold text-[#6D28D9] hover:bg-[#DDD6FE]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {isShortcutsMode ? (
          <div className="max-h-40 overflow-y-auto border-b border-[#E6EAF0] px-4 py-2">
            {messageShortcuts.length === 0 ? (
              <p className="text-sm text-[#828EA1]">No shortcuts configured.</p>
            ) : (
              <ul className="space-y-1">
                {messageShortcuts.map((shortcut) => (
                  <li key={shortcut.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setMessage(shortcut.message);
                        setComposerTab("Reply");
                      }}
                      className="w-full rounded px-2 py-1.5 text-left hover:bg-[#F4F6FB]"
                    >
                      <span className="text-sm font-semibold text-[#1972F5]">{shortcut.bang}</span>
                      <span className="ml-2 truncate text-sm text-[#495462]">{shortcut.message}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {isKnowledgeBaseMode ? (
          <div className="max-h-40 overflow-y-auto border-b border-[#E6EAF0] px-4 py-2">
            {helpArticlesLoading ? (
              <p className="text-sm text-[#828EA1]">Loading articles…</p>
            ) : helpArticles.length === 0 ? (
              <p className="text-sm text-[#828EA1]">No helpdesk articles yet.</p>
            ) : (
              <ul className="space-y-1">
                {helpArticles.map((article) => (
                  <li key={article.id}>
                    <button
                      type="button"
                      onClick={() => {
                        insertAtCursor(`Help article: ${article.title}`);
                        setComposerTab("Reply");
                      }}
                      className="w-full rounded px-2 py-1.5 text-left hover:bg-[#F4F6FB]"
                    >
                      <span className="text-sm font-semibold text-[#1972F5]">{article.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {isEditMode && !lastEditableMessage ? (
          <div className="border-b border-[#E6EAF0] px-4 py-2">
            <p className="text-sm text-[#828EA1]">No operator messages available to edit.</p>
          </div>
        ) : null}

        <div className="flex items-center gap-2 px-4 py-2.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (composerTab === "Reply" && e.target.value.trim()) {
                notifyTyping();
              } else {
                stopTyping();
              }
            }}
            onBlur={() => stopTyping()}
            onKeyDown={handleKeyDown}
            placeholder={
              isEditMode
                ? "Edit your last sent message…"
                : isNoteMode
                ? "Add an internal note for your team…"
                : isReminderMode
                  ? "Add a reminder note (optional)…"
                  : `Send your message to ${conversation.name} in chat…`
            }
            className="flex-1 resize-none outline-none text-sm text-[#2C405A] placeholder-[#828EA1] bg-transparent"
          />
          <div className="flex items-center gap-2.5 text-[#828EA1]">
            {!isNoteMode && !isReminderMode && !isEditMode && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
                  className="hidden"
                  disabled={sending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void handleFileUpload(file);
                  }}
                />
                <button
                  type="button"
                  disabled={sending}
                  aria-label="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                  className="disabled:opacity-50"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={handleWrapBold}
                  aria-label="Bold text"
                  className="text-sm font-semibold disabled:opacity-50"
                >
                  Aa
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => insertAtCursor("🙂")}
                  aria-label="Insert emoji"
                  className="disabled:opacity-50"
                >
                  <Smile size={18} />
                </button>
                <div ref={composerMoreRef} className="relative">
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => setComposerMoreOpen((open) => !open)}
                    aria-label="Composer actions"
                    className="disabled:opacity-50"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {composerMoreOpen ? (
                    <div className="absolute bottom-full right-0 z-20 mb-1 min-w-[200px] rounded-lg border border-[#E6EAF0] bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setComposerMoreOpen(false);
                          setComposerTab("Shortcuts");
                        }}
                        className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#2C405A] hover:bg-[#F4F6FB]"
                      >
                        View shortcuts
                      </button>
                      {messageShortcuts.slice(0, 4).map((shortcut) => (
                        <button
                          key={shortcut.id}
                          type="button"
                          onClick={() => handleInsertShortcut(shortcut.message)}
                          className="block w-full truncate px-3 py-2 text-left text-sm font-semibold text-[#2C405A] hover:bg-[#F4F6FB]"
                        >
                          {shortcut.tag ?? shortcut.bang}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            disabled={
              isReminderMode
                ? !canSendReminder || !onSendReminder
                : isEditMode
                  ? !canSend || !onUpdateMessage || !editingMessageId
                : !canSend || (isNoteMode ? !onSendNote : !onSend)
            }
            onClick={() => void handleSend()}
            className={cn(
              "h-9 w-9 rounded-full text-white flex items-center justify-center",
              isReminderMode
                ? canSendReminder
                  ? "bg-[#8B5CF6] text-white"
                  : "bg-[#8B5CF6]/40 cursor-not-allowed"
                : canSend
                  ? isNoteMode
                    ? "bg-[#FACA00] text-[#2C405A]"
                    : "bg-[#1972F5]"
                  : isNoteMode
                    ? "bg-[#FACA00]/40 cursor-not-allowed"
                    : "bg-[#1972F5]/40 cursor-not-allowed",
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {aiTimelineOpen && (
        <AiTimeline conversationId={conversation.id} onClose={() => setAiTimelineOpen(false)} />
      )}
    </div>
  );
}
