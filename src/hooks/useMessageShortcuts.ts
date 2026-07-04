"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MessageShortcut, MessageShortcutGroup } from "@/types/message-shortcuts";

type MessageShortcutsPayload = {
  shortcuts: MessageShortcut[];
  groups: MessageShortcutGroup[];
  tags: string[];
  shortcutsByBang: Record<string, string>;
};

const emptyPayload: MessageShortcutsPayload = {
  shortcuts: [],
  groups: [],
  tags: [],
  shortcutsByBang: {},
};

export function useMessageShortcuts(enabled: boolean) {
  const [data, setData] = useState<MessageShortcutsPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [formBang, setFormBang] = useState("");
  const [formTag, setFormTag] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const load = useCallback(async (query = debouncedSearchQuery) => {
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    const response = await fetch(`/api/message-shortcuts${params}`);
    if (!response.ok) {
      throw new Error("Failed to load message shortcuts");
    }
    return (await response.json()) as MessageShortcutsPayload;
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (!enabled) {
      setData(emptyPayload);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const payload = await load();
        if (!cancelled) {
          setData(payload);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load message shortcuts.");
          setData(emptyPayload);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, load]);

  const refresh = useCallback(async () => {
    const payload = await load();
    setData(payload);
    return payload;
  }, [load]);

  const createShortcut = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/message-shortcuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bang: formBang,
          tag: formTag || null,
          message: formMessage,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create shortcut");
      }

      setFormBang("");
      setFormTag("");
      setFormMessage("");
      await refresh();
      return true;
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create shortcut.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [formBang, formMessage, formTag, refresh]);

  const deleteShortcut = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/message-shortcuts/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete shortcut");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to delete shortcut.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const canCreate = useMemo(
    () => formBang.trim().length > 0 && formMessage.trim().length > 0 && !saving,
    [formBang, formMessage, saving],
  );

  return {
    shortcuts: data.shortcuts,
    groups: data.groups,
    tags: data.tags,
    shortcutsByBang: data.shortcutsByBang,
    loading,
    error,
    saving,
    formBang,
    formTag,
    formMessage,
    setFormBang,
    setFormTag,
    setFormMessage,
    canCreate,
    createShortcut,
    deleteShortcut,
    refresh,
    searchQuery,
    setSearchQuery,
  };
}

export function useMessageShortcutLookup(enabled: boolean) {
  const [shortcutsByBang, setShortcutsByBang] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) {
      setShortcutsByBang({});
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/message-shortcuts");
        if (!response.ok) {
          throw new Error("Failed to load message shortcuts");
        }

        const data = (await response.json()) as MessageShortcutsPayload;
        if (!cancelled) {
          setShortcutsByBang(data.shortcutsByBang);
        }
      } catch {
        if (!cancelled) {
          setShortcutsByBang({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return shortcutsByBang;
}
