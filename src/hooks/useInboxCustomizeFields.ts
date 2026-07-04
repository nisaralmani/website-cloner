"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_INBOX_CUSTOMIZE_FIELDS,
  type InboxCustomizeFieldKey,
  type InboxCustomizeFields,
} from "@/lib/inbox/customize-preferences";
import { useInboxCustomizeOptional } from "@/components/providers/InboxCustomizeProvider";

const CUSTOMIZE_PAGE = "inbox/customize";

export function useInboxCustomizeFields(enabled: boolean) {
  const [fields, setFields] = useState<InboxCustomizeFields>(DEFAULT_INBOX_CUSTOMIZE_FIELDS);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<InboxCustomizeFieldKey | null>(null);
  const inboxCustomize = useInboxCustomizeOptional();

  const load = useCallback(async () => {
    const response = await fetch(`/api/settings/${CUSTOMIZE_PAGE}`);
    if (!response.ok) {
      throw new Error("Failed to load inbox customize fields");
    }

    const data = (await response.json()) as {
      fields?: InboxCustomizeFields;
      toggles?: Record<string, boolean>;
    };

    return inboxCustomizeFromPayload(data);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setFields(DEFAULT_INBOX_CUSTOMIZE_FIELDS);
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
          setError("Unable to load inbox customize settings.");
          setFields(DEFAULT_INBOX_CUSTOMIZE_FIELDS);
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
    async (key: InboxCustomizeFieldKey, value: string) => {
      const previous = fields[key];
      setSaving(key);
      setError(null);
      setFields((current) => ({ ...current, [key]: value }));

      try {
        const response = await fetch(`/api/settings/${CUSTOMIZE_PAGE}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
          throw new Error("Failed to save inbox customize field");
        }

        const data = (await response.json()) as { key: InboxCustomizeFieldKey; value: string };
        setFields((current) => ({ ...current, [data.key]: data.value }));
        await inboxCustomize?.refresh();
        return true;
      } catch {
        setFields((current) => ({ ...current, [key]: previous }));
        setError("Unable to save inbox customize setting.");
        return false;
      } finally {
        setSaving(null);
      }
    },
    [fields, inboxCustomize],
  );

  return {
    fields,
    loading,
    error,
    saving,
    updateField,
  };
}

function inboxCustomizeFromPayload(data: {
  fields?: Partial<InboxCustomizeFields>;
}): InboxCustomizeFields {
  return {
    emailPreview: data.fields?.emailPreview ?? DEFAULT_INBOX_CUSTOMIZE_FIELDS.emailPreview,
  };
}
