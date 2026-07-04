"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CHATBOX_SEARCH_AI_FIELDS,
  type ChatboxSearchAiFieldKey,
  type ChatboxSearchAiFields,
} from "@/lib/chatbox/search-ai-preferences";

const SEARCH_AI_PAGE = "chatbox/search-ai";

export function useChatboxSearchAiFields(enabled: boolean) {
  const [fields, setFields] = useState<ChatboxSearchAiFields>(DEFAULT_CHATBOX_SEARCH_AI_FIELDS);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<ChatboxSearchAiFieldKey | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/settings/${SEARCH_AI_PAGE}`);
    if (!response.ok) {
      throw new Error("Failed to load chatbox search AI fields");
    }

    const data = (await response.json()) as { fields?: Partial<ChatboxSearchAiFields> };
    return {
      ...DEFAULT_CHATBOX_SEARCH_AI_FIELDS,
      ...data.fields,
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setFields(DEFAULT_CHATBOX_SEARCH_AI_FIELDS);
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
          setFields(payload);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load chatbox search AI settings.");
          setFields(DEFAULT_CHATBOX_SEARCH_AI_FIELDS);
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

  const updateField = useCallback(
    async (key: ChatboxSearchAiFieldKey, value: string) => {
      const previous = fields[key];
      setSaving(key);
      setError(null);
      setFields((current) => ({ ...current, [key]: value }));

      try {
        const response = await fetch(`/api/settings/${SEARCH_AI_PAGE}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
          throw new Error("Failed to save chatbox search AI field");
        }

        const data = (await response.json()) as { key: ChatboxSearchAiFieldKey; value: string };
        setFields((current) => ({ ...current, [data.key]: data.value }));
        return true;
      } catch {
        setFields((current) => ({ ...current, [key]: previous }));
        setError("Unable to save chatbox search AI setting.");
        return false;
      } finally {
        setSaving(null);
      }
    },
    [fields],
  );

  return {
    fields,
    loading,
    error,
    saving,
    updateField,
  };
}
