"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_INTERFACE_PREFERENCES,
  applyInterfacePreferences,
  type InterfaceFieldKey,
  type InterfacePreferences,
} from "@/lib/auth/interface-preferences";

const INTERFACE_PAGE = "account/interface";

export function useAccountInterface(enabled: boolean) {
  const [fields, setFields] = useState<InterfacePreferences>(DEFAULT_INTERFACE_PREFERENCES);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<InterfaceFieldKey | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/settings/${INTERFACE_PAGE}`);
    if (!response.ok) {
      throw new Error("Failed to load interface preferences");
    }

    const data = (await response.json()) as { fields: InterfacePreferences };
    return data.fields;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setFields(DEFAULT_INTERFACE_PREFERENCES);
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
          setError("Unable to load interface preferences.");
          setFields(DEFAULT_INTERFACE_PREFERENCES);
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
    async (key: InterfaceFieldKey, value: string) => {
      const previous = fields[key];
      setSaving(key);
      setError(null);
      setFields((current) => ({ ...current, [key]: value }));

      try {
        const response = await fetch(`/api/settings/${INTERFACE_PAGE}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
          throw new Error("Failed to save interface preference");
        }

        const data = (await response.json()) as { key: InterfaceFieldKey; value: string };
        setFields((current) => {
          const nextFields = { ...current, [data.key]: data.value };
          applyInterfacePreferences(nextFields);
          return nextFields;
        });
        return true;
      } catch {
        setFields((current) => ({ ...current, [key]: previous }));
        setError("Unable to save interface preference.");
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
