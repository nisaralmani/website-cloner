"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_EMAIL_DOMAIN_FIELDS,
  type EmailDomainFieldKey,
  type EmailDomainFields,
} from "@/lib/email/domain-preferences";

const EMAIL_DOMAIN_PAGE = "email/domain";

export function useEmailDomainFields(enabled: boolean) {
  const [fields, setFields] = useState<EmailDomainFields>(DEFAULT_EMAIL_DOMAIN_FIELDS);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<EmailDomainFieldKey | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/settings/${EMAIL_DOMAIN_PAGE}`);
    if (!response.ok) {
      throw new Error("Failed to load email domain fields");
    }

    const data = (await response.json()) as { fields?: Partial<EmailDomainFields> };
    return {
      ...DEFAULT_EMAIL_DOMAIN_FIELDS,
      ...data.fields,
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setFields(DEFAULT_EMAIL_DOMAIN_FIELDS);
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
          setError("Unable to load email domain settings.");
          setFields(DEFAULT_EMAIL_DOMAIN_FIELDS);
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
    async (key: EmailDomainFieldKey, value: string) => {
      const previous = fields[key];
      setSaving(key);
      setError(null);
      setFields((current) => ({ ...current, [key]: value }));

      try {
        const response = await fetch(`/api/settings/${EMAIL_DOMAIN_PAGE}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to save email domain field");
        }

        const data = (await response.json()) as { key: EmailDomainFieldKey; value: string };
        setFields((current) => {
          const next = { ...current, [data.key]: data.value };
          if (data.key === "customDomain") {
            next.domainVerified = "false";
          }
          return next;
        });
        return true;
      } catch (saveError) {
        setFields((current) => ({ ...current, [key]: previous }));
        setError(
          saveError instanceof Error ? saveError.message : "Unable to save email domain setting.",
        );
        return false;
      } finally {
        setSaving(null);
      }
    },
    [fields],
  );

  const verifyCustomDomain = useCallback(async () => {
    if (!fields.customDomain.trim()) {
      setError("Enter a custom domain before verifying.");
      return false;
    }
    setSaving("domainVerified");
    setError(null);
    try {
      const response = await fetch(`/api/settings/${EMAIL_DOMAIN_PAGE}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "domainVerified", value: "true" }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to verify domain");
      }
      setFields((current) => ({ ...current, domainVerified: "true" }));
      return true;
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Unable to verify domain.");
      return false;
    } finally {
      setSaving(null);
    }
  }, [fields.customDomain]);

  return {
    fields,
    loading,
    error,
    saving,
    updateField,
    verifyCustomDomain,
  };
}
