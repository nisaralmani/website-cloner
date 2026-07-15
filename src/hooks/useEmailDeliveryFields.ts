"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SMTP_FIELDS,
  type SmtpFieldKey,
  type SmtpFields,
} from "@/lib/email/smtp-preferences";

const EMAIL_DELIVERY_PAGE = "email/delivery";

export type EmailConnectionTestResult = {
  imap?: { ok: boolean; error?: string };
  smtp?: { ok: boolean; error?: string };
};

export function useEmailDeliveryFields(enabled: boolean) {
  const [fields, setFields] = useState<SmtpFields>(DEFAULT_SMTP_FIELDS);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<SmtpFieldKey | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<EmailConnectionTestResult | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/settings/${EMAIL_DELIVERY_PAGE}`);
    if (!response.ok) {
      throw new Error("Failed to load email delivery fields");
    }

    const data = (await response.json()) as { fields?: Partial<SmtpFields> };
    return {
      ...DEFAULT_SMTP_FIELDS,
      ...data.fields,
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setFields(DEFAULT_SMTP_FIELDS);
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
          setError("Unable to load email delivery settings.");
          setFields(DEFAULT_SMTP_FIELDS);
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
    async (key: SmtpFieldKey, value: string) => {
      const previous = fields[key];
      setSaving(key);
      setError(null);
      setFields((current) => ({ ...current, [key]: value }));

      try {
        const response = await fetch(`/api/settings/${EMAIL_DELIVERY_PAGE}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to save email delivery field");
        }

        const data = (await response.json()) as { key: SmtpFieldKey; value: string };
        // Password fields are write-only: keep showing blank locally rather
        // than echoing the just-typed value back into the input's state.
        const isPasswordKey = data.key.endsWith("Password");
        setFields((current) => ({ ...current, [data.key]: isPasswordKey ? "" : data.value }));
        return true;
      } catch (saveError) {
        setFields((current) => ({ ...current, [key]: previous }));
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to save email delivery setting.",
        );
        return false;
      } finally {
        setSaving(null);
      }
    },
    [fields],
  );

  const testConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ which: "both" }),
      });
      const data = (await response.json().catch(() => ({}))) as EmailConnectionTestResult;
      setTestResult(data);
    } catch {
      setTestResult({
        imap: { ok: false, error: "Request failed" },
        smtp: { ok: false, error: "Request failed" },
      });
    } finally {
      setTesting(false);
    }
  }, []);

  return {
    fields,
    loading,
    error,
    saving,
    updateField,
    testing,
    testResult,
    testConnection,
  };
}
