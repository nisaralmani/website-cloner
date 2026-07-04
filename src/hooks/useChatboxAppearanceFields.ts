"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CHATBOX_APPEARANCE_FIELDS,
  type ChatboxAppearanceFieldKey,
  type ChatboxAppearanceFields,
} from "@/lib/chatbox/appearance-preferences";

const APPEARANCE_PAGE = "chatbox/appearance";

export function useChatboxAppearanceFields(enabled: boolean) {
  const [fields, setFields] = useState<ChatboxAppearanceFields>(DEFAULT_CHATBOX_APPEARANCE_FIELDS);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<ChatboxAppearanceFieldKey | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/settings/${APPEARANCE_PAGE}`);
    if (!response.ok) {
      throw new Error("Failed to load chatbox appearance fields");
    }

    const data = (await response.json()) as { fields?: Partial<ChatboxAppearanceFields> };
    return appearanceFieldsFromPayload(data);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setFields(DEFAULT_CHATBOX_APPEARANCE_FIELDS);
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
          setError("Unable to load chatbox appearance settings.");
          setFields(DEFAULT_CHATBOX_APPEARANCE_FIELDS);
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
    async (key: ChatboxAppearanceFieldKey, value: string) => {
      const previous = fields[key];
      setSaving(key);
      setError(null);
      setFields((current) => ({ ...current, [key]: value }));

      try {
        const response = await fetch(`/api/settings/${APPEARANCE_PAGE}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
          throw new Error("Failed to save chatbox appearance field");
        }

        const data = (await response.json()) as { key: ChatboxAppearanceFieldKey; value: string };
        setFields((current) => ({ ...current, [data.key]: data.value }));
        return true;
      } catch {
        setFields((current) => ({ ...current, [key]: previous }));
        setError("Unable to save chatbox appearance setting.");
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

function appearanceFieldsFromPayload(data: {
  fields?: Partial<ChatboxAppearanceFields>;
}): ChatboxAppearanceFields {
  return {
    ...DEFAULT_CHATBOX_APPEARANCE_FIELDS,
    ...data.fields,
  };
}
