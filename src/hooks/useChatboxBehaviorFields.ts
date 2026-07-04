"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CHATBOX_BEHAVIOR_FIELDS,
  type ChatboxBehaviorFieldKey,
  type ChatboxBehaviorFields,
} from "@/lib/chatbox/behavior-preferences";

const BEHAVIOR_PAGE = "chatbox/behavior";

export function useChatboxBehaviorFields(enabled: boolean) {
  const [fields, setFields] = useState<ChatboxBehaviorFields>(DEFAULT_CHATBOX_BEHAVIOR_FIELDS);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<ChatboxBehaviorFieldKey | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/settings/${BEHAVIOR_PAGE}`);
    if (!response.ok) {
      throw new Error("Failed to load chatbox behavior fields");
    }

    const data = (await response.json()) as { fields?: Partial<ChatboxBehaviorFields> };
    return behaviorFieldsFromPayload(data);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setFields(DEFAULT_CHATBOX_BEHAVIOR_FIELDS);
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
          setError("Unable to load chatbox behavior settings.");
          setFields(DEFAULT_CHATBOX_BEHAVIOR_FIELDS);
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
    async (key: ChatboxBehaviorFieldKey, value: string) => {
      const previous = fields[key];
      setSaving(key);
      setError(null);
      setFields((current) => ({ ...current, [key]: value }));

      try {
        const response = await fetch(`/api/settings/${BEHAVIOR_PAGE}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
          throw new Error("Failed to save chatbox behavior field");
        }

        const data = (await response.json()) as { key: ChatboxBehaviorFieldKey; value: string };
        setFields((current) => ({ ...current, [data.key]: data.value }));
        return true;
      } catch {
        setFields((current) => ({ ...current, [key]: previous }));
        setError("Unable to save chatbox behavior setting.");
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

function behaviorFieldsFromPayload(data: {
  fields?: Partial<ChatboxBehaviorFields>;
}): ChatboxBehaviorFields {
  return {
    ...DEFAULT_CHATBOX_BEHAVIOR_FIELDS,
    ...data.fields,
  };
}
