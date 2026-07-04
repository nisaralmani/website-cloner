"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Mic, Paperclip, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/inbox";
import { useChatboxStream } from "@/hooks/useChatboxStream";
import { useTypingPing } from "@/hooks/useTypingPing";
import { MessageAttachmentPreview } from "@/components/inbox/MessageAttachmentPreview";
import type { HelpdeskArticle } from "@/types/helpdesk";
import { CHATBOX_POLL_FALLBACK_MS } from "@/lib/inbox/realtime";
import {
  publicHelpdeskArticleApiPath,
  publicHelpdeskListApiPath,
} from "@/lib/public-helpdesk";
import { agentDebugLog } from "@/lib/debug-agent-log";
import type { WidgetIdentifyResult } from "@/lib/chatbox/widget-identify";
import {
  WIDGET_ESCALATE_RE,
  WIDGET_GREETING_RE,
} from "@/lib/chatbox/widget-escalation";

type CollectPhase = "idle" | "awaiting_name" | "awaiting_email" | "done";

type LocalBubble = {
  id: string;
  text: string;
  kind: "ai" | "system" | "user";
};

type WidgetConfig = {
  workspaceId: string;
  name: string;
  domain: string;
  allowFiles?: boolean;
  allowAudio?: boolean;
  maxAttachmentBytes?: number;
  askEmail?: boolean;
  askPhone?: boolean;
  forceIdentify?: boolean;
  ratingsEnabled?: boolean;
};

type ApiMessage = Message & { sortOrder?: number };

function storageKey(workspaceId: string) {
  return `bybelt-chatbox:${workspaceId}`;
}

function maxSortOrder(messages: ApiMessage[]): number {
  return messages.reduce((max, item) => Math.max(max, item.sortOrder ?? -1), -1);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function VisitorChatWidget({
  domain,
  workspaceId: workspaceIdProp,
  initialEmail,
  initialName,
  className,
}: {
  domain?: string;
  workspaceId?: string;
  initialEmail?: string;
  initialName?: string;
  className?: string;
}) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorTyping, setOperatorTyping] = useState(false);
  const [operatorTypingName, setOperatorTypingName] = useState<string | null>(null);
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const lastSortOrderRef = useRef(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const receiptAckRef = useRef(new Set<string>());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [ratingScore, setRatingScore] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [helpArticles, setHelpArticles] = useState<HelpdeskArticle[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [articleQuery, setArticleQuery] = useState("");
  const [humanMode, setHumanMode] = useState(false);
  const [collect, setCollect] = useState<CollectPhase>("idle");
  const [identified, setIdentified] = useState(false);
  const [custName, setCustName] = useState(initialName?.trim() ?? "");
  const [custEmail, setCustEmail] = useState(initialEmail?.trim() ?? "");
  const [localBubbles, setLocalBubbles] = useState<LocalBubble[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const pendingQuestion = useRef<string | null>(null);

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

  const postReceipt = useCallback(
    async (messageId: string, status: "delivered" | "read") => {
      if (!sessionId) return;
      const key = `${messageId}:${status}`;
      if (receiptAckRef.current.has(key)) return;
      receiptAckRef.current.add(key);
      try {
        await fetch(`/api/chatbox/sessions/${sessionId}/messages/${messageId}/receipt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } catch {
        receiptAckRef.current.delete(key);
      }
    },
    [sessionId],
  );

  const appendMessages = useCallback((incoming: ApiMessage[]) => {
    if (incoming.length === 0) return;
    if (incoming.some((message) => message.from === "operator")) {
      setOperatorTyping(false);
      setOperatorTypingName(null);
    }
    lastSortOrderRef.current = Math.max(lastSortOrderRef.current, maxSortOrder(incoming));
    setMessages((current) => {
      const seen = new Set(current.map((message) => message.id));
      const merged = [...current];
      for (const message of incoming) {
        if (seen.has(message.id)) continue;
        merged.push(message);
        seen.add(message.id);
      }
      return merged;
    });
  }, []);

  const { connected: streamConnected } = useChatboxStream({
    sessionId,
    enabled: Boolean(sessionId) && !loading,
    onMessages: appendMessages,
    onTyping: (typing, operatorName) => {
      setOperatorTyping(typing);
      setOperatorTypingName(operatorName ?? null);
    },
    onReceipt: applyReceipt,
  });

  const { notifyTyping, stopTyping } = useTypingPing({
    url: sessionId ? `/api/chatbox/sessions/${sessionId}/typing` : null,
    enabled: Boolean(sessionId) && !loading,
  });

  const persistIdentity = useCallback(async () => {
    if (!sessionId) return;
    const email = visitorEmail.trim();
    const phone = visitorPhone.trim();
    if (!email && !phone) return;
    try {
      await fetch(`/api/chatbox/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
        }),
      });
    } catch {
      // Silent — send path still validates identity.
    }
  }, [sessionId, visitorEmail, visitorPhone]);

  useEffect(() => {
    if (!config?.domain) {
      setHelpArticles([]);
      return;
    }

    let cancelled = false;
    setHelpLoading(true);

    void (async () => {
      try {
        const response = await fetch(publicHelpdeskListApiPath(config.domain));
        if (!response.ok) return;
        const data = (await response.json()) as {
          helpdeskEnabled?: boolean;
          articles?: HelpdeskArticle[];
        };
        if (!cancelled && data.helpdeskEnabled) {
          setHelpArticles(data.articles ?? []);
        }
      } catch {
        if (!cancelled) setHelpArticles([]);
      } finally {
        if (!cancelled) setHelpLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config?.domain]);

  useEffect(() => {
    if (!sessionId || loading) return;
    for (const message of messages) {
      if (message.from !== "operator") continue;
      if (!message.deliveredAt) {
        void postReceipt(message.id, "delivered");
      } else if (!message.readAt) {
        void postReceipt(message.id, "read");
      }
    }
  }, [loading, messages, postReceipt, sessionId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (workspaceIdProp) params.set("workspaceId", workspaceIdProp);
        if (domain) params.set("domain", domain);
        const configResponse = await fetch(`/api/chatbox/config?${params.toString()}`);
        if (!configResponse.ok) {
          agentDebugLog("VisitorChatWidget.tsx:init", "chatbox config failed", {
            status: configResponse.status,
            domain,
            workspaceIdProp,
          }, "H4");
          throw new Error("Unable to load chatbox");
        }
        const configData = (await configResponse.json()) as WidgetConfig;
        if (cancelled) return;
        setConfig(configData);
        agentDebugLog("VisitorChatWidget.tsx:init", "chatbox config loaded", {
          workspaceId: configData.workspaceId,
          chatboxVisible: (configData as WidgetConfig & { chatboxVisible?: boolean }).chatboxVisible ?? null,
        }, "H4");

        const storedSessionId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(storageKey(configData.workspaceId))
            : null;

        const pagePath =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : undefined;

        const sessionResponse = await fetch("/api/chatbox/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: configData.workspaceId,
            sessionId: storedSessionId,
            pageUrl: pagePath,
            locale: typeof navigator !== "undefined" ? navigator.language : undefined,
          }),
        });

        if (!sessionResponse.ok) {
          let sessionError = "Unable to start chat session";
          try {
            const payload = (await sessionResponse.json()) as { error?: string };
            if (payload.error?.trim()) sessionError = payload.error.trim();
          } catch {
            // ignore parse errors
          }
          agentDebugLog("VisitorChatWidget.tsx:init", "chatbox session failed", {
            status: sessionResponse.status,
            error: sessionError,
            workspaceId: configData.workspaceId,
          }, "H4");
          throw new Error(sessionError);
        }

        const sessionData = (await sessionResponse.json()) as {
          sessionId: string;
          messages: ApiMessage[];
        };
        if (cancelled) return;

        window.localStorage.setItem(storageKey(configData.workspaceId), sessionData.sessionId);
        setSessionId(sessionData.sessionId);
        setMessages(sessionData.messages);
        lastSortOrderRef.current = maxSortOrder(sessionData.messages);
      } catch (widgetError) {
        agentDebugLog("VisitorChatWidget.tsx:init", "chatbox init error surfaced", {
          message: widgetError instanceof Error ? widgetError.message : "unknown",
        }, "H4");
        if (!cancelled) {
          setError("Chat is unavailable right now.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [domain, workspaceIdProp]);

  const pollMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(
        `/api/chatbox/sessions/${sessionId}/messages?after=${lastSortOrderRef.current}`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as { messages: ApiMessage[] };
      appendMessages(data.messages);
    } catch {
      // Silent poll failure.
    }
  }, [appendMessages, sessionId]);

  useEffect(() => {
    if (!sessionId || streamConnected) return;
    const timer = setInterval(() => void pollMessages(), CHATBOX_POLL_FALLBACK_MS);
    return () => clearInterval(timer);
  }, [pollMessages, sessionId, streamConnected]);

  const pingPresence = useCallback(async () => {
    if (!sessionId) return;
    try {
      await fetch(`/api/chatbox/sessions/${sessionId}/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageUrl:
            typeof window !== "undefined"
              ? `${window.location.pathname}${window.location.search}`
              : undefined,
        }),
      });
    } catch {
      // Silent presence failure.
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || loading) return;
    void pingPresence();
    const timer = window.setInterval(() => {
      void pingPresence();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [loading, pingPresence, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [localBubbles, messages, aiTyping]);

  const mergedTimeline = useCallback(() => {
    type TimelineItem =
      | { key: string; kind: "message"; message: ApiMessage }
      | { key: string; kind: "local"; bubble: LocalBubble };
    const items: TimelineItem[] = messages.map((message) => ({
      key: message.id,
      kind: "message",
      message,
    }));
    for (const bubble of localBubbles) {
      items.push({ key: bubble.id, kind: "local", bubble });
    }
    return items;
  }, [localBubbles, messages]);

  const appendSentMessage = useCallback((message: ApiMessage) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) {
        return current;
      }
      return [...current, message];
    });
    lastSortOrderRef.current = Math.max(
      lastSortOrderRef.current,
      message.sortOrder ?? lastSortOrderRef.current,
    );
    setError(null);
  }, []);

  const pushLocalUser = useCallback((text: string) => {
    setLocalBubbles((current) => [
      ...current,
      { id: `user_${Date.now()}`, text, kind: "user" },
    ]);
  }, []);

  const pushLocalAi = useCallback((text: string) => {
    setLocalBubbles((current) => [
      ...current,
      { id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, text, kind: "ai" },
    ]);
  }, []);

  const pushSystem = useCallback((text: string) => {
    setLocalBubbles((current) => [
      ...current,
      { id: `sys_${Date.now()}`, text, kind: "system" },
    ]);
  }, []);

  const typeThen = useCallback(
    async (text: string, ms = 900) => {
      setAiTyping(true);
      await sleep(ms);
      setAiTyping(false);
      pushLocalAi(text);
    },
    [pushLocalAi],
  );

  const requestHandoff = useCallback(async () => {
    if (!sessionId) return;
    setHumanMode(true);
    pushSystem("Connecting you to a teammate — they'll reply right here.");
    try {
      await fetch(`/api/chatbox/sessions/${sessionId}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: custEmail || visitorEmail.trim() || undefined,
          name: custName || undefined,
        }),
      });
    } catch {
      // Handoff still shows waiting state.
    }
  }, [custEmail, custName, pushSystem, sessionId, visitorEmail]);

  const sendToServer = useCallback(
    async (text: string) => {
      if (!sessionId || sending) return;
      stopTyping();
      setSending(true);
      try {
        const response = await fetch(`/api/chatbox/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            ...(custEmail || visitorEmail.trim()
              ? { email: custEmail || visitorEmail.trim() }
              : {}),
            ...(visitorPhone.trim() ? { phone: visitorPhone.trim() } : {}),
          }),
        });
        if (!response.ok) {
          throw new Error("Send failed");
        }
        const data = (await response.json()) as {
          dropped?: boolean;
          message?: ApiMessage | null;
          aiReply?: { message?: ApiMessage | null } | null;
          escalated?: boolean;
          humanMode?: boolean;
          lookup?: boolean;
        };
        if (data.dropped || !data.message) {
          setError("Message could not be delivered.");
          return;
        }
        appendSentMessage(data.message);
        if (data.escalated || data.humanMode) {
          setHumanMode(true);
        }
        if (data.aiReply?.message) {
          appendMessages([data.aiReply.message]);
        }
        if (data.lookup) {
          void pollMessages();
        }
      } catch {
        setError("Unable to send message.");
        throw new Error("send failed");
      } finally {
        setSending(false);
      }
    },
    [
      appendMessages,
      appendSentMessage,
      custEmail,
      pollMessages,
      sending,
      sessionId,
      stopTyping,
      visitorEmail,
      visitorPhone,
    ],
  );

  const identifyAndContinue = useCallback(
    async (email: string) => {
      if (!sessionId) return;
      setAiTyping(true);
      let result: WidgetIdentifyResult | { valid?: false } | null = null;
      try {
        const response = await fetch(`/api/chatbox/sessions/${sessionId}/identify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: custName, email }),
        });
        result = (await response.json()) as WidgetIdentifyResult | { valid?: false };
      } catch {
        result = null;
      }
      setAiTyping(false);

      if (!result || !("ok" in result) || !result.ok || result.valid === false) {
        await typeThen("Hmm, that doesn't look like a valid email address — could you re-enter it?", 700);
        return;
      }

      const cleanEmail = result.email || email;
      setCustEmail(cleanEmail);
      setVisitorEmail(cleanEmail);
      setIdentified(true);
      setCollect("done");

      const orders = "orders" in result ? result.orders : [];
      if (orders.length) {
        const recent = orders
          .slice(0, 3)
          .map((order) => `• ${order.number} — ${order.status}`)
          .join("\n");
        await typeThen(
          `Thanks! I found ${"ordersCount" in result ? result.ordersCount : orders.length} order(s) on ${cleanEmail}.\n\nRecent orders:\n${recent}`,
          900,
        );
      } else {
        await typeThen("You're all set — what can I help you with?", 800);
      }

      if (pendingQuestion.current) {
        const question = pendingQuestion.current;
        pendingQuestion.current = null;
        setDraft(question);
      }
    },
    [custName, sessionId, typeThen],
  );

  useEffect(() => {
    if (!sessionId || !initialEmail?.trim() || identified) return;
    setCollect("done");
    setIdentified(true);
    setCustEmail(initialEmail.trim());
    setVisitorEmail(initialEmail.trim());
    if (initialName?.trim()) {
      setCustName(initialName.trim());
    }
    void identifyAndContinue(initialEmail.trim());
  }, [identified, identifyAndContinue, initialEmail, initialName, sessionId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !sessionId || sending) return;
    setDraft("");

    if (WIDGET_ESCALATE_RE.test(text)) {
      pushLocalUser(text);
      await requestHandoff();
      try {
        await sendToServer(text);
      } catch {
        // Escalation already shown.
      }
      return;
    }

    if (humanMode) {
      try {
        await sendToServer(text);
      } catch {
        setDraft(text);
      }
      return;
    }

    if (collect === "awaiting_name") {
      pushLocalUser(text);
      setCustName(text);
      await typeThen(`Thanks ${text.split(" ")[0]}! And what's the best email address to reach you?`, 900);
      setCollect("awaiting_email");
      return;
    }

    if (collect === "awaiting_email") {
      pushLocalUser(text);
      await identifyAndContinue(text);
      return;
    }

    if (collect === "idle" && !identified && !(custEmail || visitorEmail.trim())) {
      pushLocalUser(text);
      if (WIDGET_GREETING_RE.test(text)) {
        await typeThen("Hello! 👋 How can we help you today?", 800);
        await typeThen("To help you faster, may I have your name?", 900);
      } else {
        pendingQuestion.current = text;
        await typeThen("Sure — before I check that, may I have your name?", 900);
      }
      setCollect("awaiting_name");
      return;
    }

    setAiTyping(true);
    try {
      await sendToServer(text);
    } catch {
      setDraft(text);
    } finally {
      setAiTyping(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!sessionId || sending) return;

    stopTyping();
    setSending(true);
    const caption = draft.trim();
    setDraft("");
    try {
      const form = new FormData();
      form.append("file", file);
      if (caption) {
        form.append("text", caption);
      }

      const response = await fetch(`/api/chatbox/sessions/${sessionId}/messages`, {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const data = (await response.json()) as {
        dropped?: boolean;
        message?: ApiMessage | null;
      };
      if (data.dropped || !data.message) {
        setError("File could not be delivered.");
        if (caption) setDraft(caption);
        return;
      }
      appendSentMessage(data.message);
    } catch {
      setError("Unable to upload file.");
      if (caption) setDraft(caption);
    } finally {
      setSending(false);
    }
  };

  const handleAudioUpload = async (file: File) => {
    if (!sessionId || sending) return;

    stopTyping();
    setSending(true);
    try {
      const form = new FormData();
      form.append("file", file, file.name || "recording.webm");

      const response = await fetch(`/api/chatbox/sessions/${sessionId}/messages`, {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const data = (await response.json()) as {
        dropped?: boolean;
        message?: ApiMessage | null;
      };
      if (data.dropped || !data.message) {
        setError("Audio could not be delivered.");
        return;
      }
      appendSentMessage(data.message);
    } catch {
      setError("Unable to upload audio.");
    } finally {
      setSending(false);
    }
  };

  const closeWidget = () => {
    window.parent?.postMessage({ type: "bybelt-chatbox-close" }, "*");
  };

  const toggleRecording = async () => {
    if (!sessionId || sending || config?.allowAudio === false) return;

    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        setRecording(false);
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (blob.size > 0) {
          void handleAudioUpload(
            new File([blob], "recording.webm", { type: blob.type || "audio/webm" }),
          );
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setError(null);
    } catch {
      setError("Microphone permission is required to record audio.");
    }
  };

  return (
    <div
      className={cn(
        "flex h-[min(520px,calc(100vh-3rem))] w-[min(376px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#E8EAEB] bg-white shadow-[0_20px_60px_rgba(25,37,59,0.18)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 bg-[#1972F5] px-4 py-3 text-white">
        <MessageCircle size={18} />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {config?.name ?? "Chat"} support
          </span>
          <span className="block truncate text-[10px] text-white/85">
            {humanMode ? "A teammate will reply shortly" : "Typically replies instantly"}
          </span>
        </div>
        <button
          type="button"
          aria-label="Close chat"
          onClick={closeWidget}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/85 hover:bg-white/15 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#F4F6FB] p-4">
        {loading ? (
          <p className="text-center text-sm text-[#828EA1]">Connecting…</p>
        ) : error && messages.length === 0 ? (
          <p className="text-center text-sm text-[#B91C1C]">{error}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-[#242F47] shadow-sm">
              Hi! How can we help you today?
            </div>
            {mergedTimeline().map((item) => {
              if (item.kind === "local") {
                if (item.bubble.kind === "system") {
                  return (
                    <div key={item.key} className="text-center">
                      <span className="inline-block rounded-full bg-[#E8EAEB]/80 px-3 py-1 text-[11px] font-medium text-[#5D6B98]">
                        {item.bubble.text}
                      </span>
                    </div>
                  );
                }
                const isUser = item.bubble.kind === "user";
                return (
                  <div
                    key={item.key}
                    className={cn(
                      "flex max-w-[85%] flex-col gap-1",
                      isUser ? "ml-auto items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap",
                        isUser
                          ? "rounded-br-md bg-[#1972F5] text-white"
                          : "rounded-bl-md bg-white text-[#242F47]",
                      )}
                    >
                      {item.bubble.text}
                    </div>
                  </div>
                );
              }

              const message = item.message;
              return (
              <div
                key={item.key}
                className={cn(
                  "flex max-w-[85%] flex-col gap-1",
                  message.from === "visitor" ? "ml-auto items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "space-y-2 rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                    message.from === "visitor"
                      ? "rounded-br-md bg-[#1972F5] text-white"
                      : "rounded-bl-md bg-white text-[#242F47]",
                  )}
                >
                  {message.attachment && (
                    <MessageAttachmentPreview
                      attachment={message.attachment}
                      variant={message.from === "visitor" ? "widget" : "inbox"}
                    />
                  )}
                  {message.text && !(message.attachment && message.text.startsWith("📎 ")) ? (
                    <p>{message.text}</p>
                  ) : null}
                  {!message.attachment && message.text ? <p>{message.text}</p> : null}
                </div>
                {message.from === "visitor" && message.readAt && (
                  <span className="text-[11px] text-[#828EA1]">Read</span>
                )}
              </div>
              );
            })}
            {aiTyping && (
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-[#828EA1] shadow-sm">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#828EA1]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#828EA1] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#828EA1] [animation-delay:300ms]" />
                </span>
              </div>
            )}
            {operatorTyping && (
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-[#828EA1] shadow-sm">
                {operatorTypingName ? `${operatorTypingName} is typing…` : "Support is typing…"}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#E8EAEB] bg-white p-3">
        {error && messages.length > 0 && (
          <p className="mb-2 text-xs text-[#B91C1C]">{error}</p>
        )}
        {helpArticles.length > 0 ? (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setHelpOpen((open) => !open)}
              className="text-xs font-semibold text-[#1972F5] hover:underline"
            >
              {helpOpen ? "Hide help articles" : "Browse help articles"}
            </button>
            {helpOpen ? (
              <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-[#E8EAEB] bg-[#F9FAFB] p-2">
                <input
                  type="text"
                  value={articleQuery}
                  onChange={(event) => setArticleQuery(event.target.value)}
                  placeholder="Search articles…"
                  className="mb-2 w-full rounded border border-[#E8EAEB] px-2 py-1 text-xs outline-none"
                />
                {helpLoading ? (
                  <p className="text-xs text-[#828EA1]">Loading…</p>
                ) : (
                  <ul className="space-y-1">
                    {helpArticles
                      .filter((article) =>
                        article.title.toLowerCase().includes(articleQuery.trim().toLowerCase()),
                      )
                      .slice(0, 8)
                      .map((article) => (
                        <li key={article.id}>
                          <button
                            type="button"
                            onClick={() => {
                              void fetch(publicHelpdeskArticleApiPath(article.id, config?.domain ?? ""))
                                .then((response) => (response.ok ? response.json() : null))
                                .then((data: { article?: HelpdeskArticle } | null) => {
                                  if (data?.article?.body) {
                                    window.alert(data.article.body.slice(0, 500));
                                  }
                                });
                            }}
                            className="w-full truncate text-left text-xs font-semibold text-[#1C293B] hover:text-[#1972F5]"
                          >
                            {article.title}
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
        {!humanMode && sessionId ? (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => void requestHandoff()}
              className="text-xs font-semibold text-[#1972F5] hover:underline"
            >
              Talk to a human
            </button>
          </div>
        ) : null}
        {(config?.askEmail || config?.askPhone || config?.forceIdentify) && (
          <div className="mb-2 grid gap-2">
            {(config.askEmail || config.forceIdentify) && (
              <input
                type="email"
                value={visitorEmail}
                onChange={(event) => setVisitorEmail(event.target.value)}
                onBlur={() => void persistIdentity()}
                placeholder="Your email"
                className="w-full rounded-lg border border-[#E8EAEB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#242F47] outline-none focus:border-[#1972F5]"
              />
            )}
            {(config.askPhone || config.forceIdentify) && (
              <input
                type="tel"
                value={visitorPhone}
                onChange={(event) => setVisitorPhone(event.target.value)}
                onBlur={() => void persistIdentity()}
                placeholder="Your phone"
                className="w-full rounded-lg border border-[#E8EAEB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#242F47] outline-none focus:border-[#1972F5]"
              />
            )}
          </div>
        )}
        <form
          className="flex items-center gap-2 rounded-xl border border-[#E8EAEB] bg-[#F9FAFB] px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          {config?.allowFiles !== false && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
                className="hidden"
                disabled={loading || !sessionId || sending || recording}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void handleFileUpload(file);
                }}
              />
              <button
                type="button"
                disabled={loading || !sessionId || sending || recording}
                aria-label="Attach file"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#828EA1] hover:bg-white disabled:opacity-50"
              >
                <Paperclip size={16} />
              </button>
            </>
          )}
          {config?.allowAudio !== false && (
            <button
              type="button"
              disabled={loading || !sessionId || sending}
              aria-label={recording ? "Stop recording" : "Record audio"}
              onClick={() => void toggleRecording()}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:opacity-50",
                recording
                  ? "bg-[#B91C1C] text-white"
                  : "text-[#828EA1] hover:bg-white",
              )}
            >
              <Mic size={16} />
            </button>
          )}
          <input
            type="text"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (event.target.value.trim()) {
                notifyTyping();
              } else {
                stopTyping();
              }
            }}
            onBlur={() => stopTyping()}
            placeholder="Compose your message…"
            disabled={loading || !sessionId || sending}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#242F47] outline-none placeholder:text-[#828EA1] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !sessionId || sending || !draft.trim()}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1972F5] text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
        {config?.ratingsEnabled && sessionId ? (
          <div className="mt-3 border-t border-[#E8EAEB] pt-3">
            <p className="mb-2 text-xs font-semibold text-[#5D6B98]">Rate this conversation</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  disabled={submittingRating || ratingScore !== null}
                  onClick={() => {
                    if (!sessionId) return;
                    setSubmittingRating(true);
                    void fetch(`/api/chatbox/sessions/${sessionId}/rate`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ score }),
                    })
                      .then(async (response) => {
                        if (!response.ok) {
                          const data = (await response.json()) as { error?: string };
                          throw new Error(data.error ?? "Unable to submit rating");
                        }
                        setRatingScore(score);
                      })
                      .catch((err) => {
                        setError(err instanceof Error ? err.message : "Unable to submit rating.");
                      })
                      .finally(() => setSubmittingRating(false));
                  }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm",
                    ratingScore !== null && score <= ratingScore
                      ? "bg-[#1972F5] text-white"
                      : "bg-[#F4F6FB] text-[#828EA1] hover:bg-[#E8F0FE] disabled:opacity-60",
                  )}
                  aria-label={`Rate ${score} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            {ratingScore !== null ? (
              <p className="mt-2 text-xs text-[#39A746]">Thanks for your feedback!</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
