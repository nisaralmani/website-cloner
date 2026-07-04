"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_WORKSPACE_ADVANCED_FIELDS,
  type WorkspaceAdvancedFieldKey,
  type WorkspaceAdvancedFields,
} from "@/lib/settings/workspace-advanced";
import type { WorkspaceApiToken, WorkspaceWebhook } from "@/types/workspace-advanced";

const ADVANCED_PAGE = "workspace/advanced";

export function useWorkspaceAdvanced(enabled: boolean) {
  const [fields, setFields] = useState<WorkspaceAdvancedFields>(DEFAULT_WORKSPACE_ADVANCED_FIELDS);
  const [tokens, setTokens] = useState<WorkspaceApiToken[]>([]);
  const [webhooks, setWebhooks] = useState<WorkspaceWebhook[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldSaving, setFieldSaving] = useState<WorkspaceAdvancedFieldKey | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [webhookTestMessage, setWebhookTestMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [settingsResponse, tokensResponse, webhooksResponse] = await Promise.all([
      fetch(`/api/settings/${ADVANCED_PAGE}`),
      fetch("/api/workspaces/api-tokens"),
      fetch("/api/workspaces/webhooks"),
    ]);

    if (!settingsResponse.ok || !tokensResponse.ok || !webhooksResponse.ok) {
      throw new Error("Failed to load workspace advanced settings");
    }

    const settingsData = (await settingsResponse.json()) as {
      fields?: Partial<WorkspaceAdvancedFields>;
    };
    const tokensData = (await tokensResponse.json()) as { tokens: WorkspaceApiToken[] };
    const webhooksData = (await webhooksResponse.json()) as { webhooks: WorkspaceWebhook[] };

    return {
      fields: {
        ...DEFAULT_WORKSPACE_ADVANCED_FIELDS,
        ...settingsData.fields,
      },
      tokens: tokensData.tokens,
      webhooks: webhooksData.webhooks,
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setFields(DEFAULT_WORKSPACE_ADVANCED_FIELDS);
      setTokens([]);
      setWebhooks([]);
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
          setFields(payload.fields);
          setTokens(payload.tokens);
          setWebhooks(payload.webhooks);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load advanced workspace settings.");
          setFields(DEFAULT_WORKSPACE_ADVANCED_FIELDS);
          setTokens([]);
          setWebhooks([]);
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
    setFields(payload.fields);
    setTokens(payload.tokens);
    setWebhooks(payload.webhooks);
    return payload;
  }, [load]);

  const updateField = useCallback(
    async (key: WorkspaceAdvancedFieldKey, value: string) => {
      const previous = fields[key];
      setFieldSaving(key);
      setError(null);
      setFields((current) => ({ ...current, [key]: value }));

      try {
        const response = await fetch(`/api/settings/${ADVANCED_PAGE}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
          throw new Error("Failed to save advanced field");
        }

        const data = (await response.json()) as { key: WorkspaceAdvancedFieldKey; value: string };
        setFields((current) => ({ ...current, [data.key]: data.value }));
        return true;
      } catch {
        setFields((current) => ({ ...current, [key]: previous }));
        setError("Unable to save advanced setting.");
        return false;
      } finally {
        setFieldSaving(null);
      }
    },
    [fields],
  );

  const createToken = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/workspaces/api-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error("Failed to create API token");
      }

      await refresh();
      return true;
    } catch {
      setError("Unable to create API token.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const deleteToken = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/workspaces/api-tokens/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete API token");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to delete API token.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const createWebhook = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/workspaces/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error("Failed to create web hook");
      }

      await refresh();
      return true;
    } catch {
      setError("Unable to create web hook.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const deleteWebhook = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/workspaces/webhooks/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete web hook");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to delete web hook.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const toggleWebhook = useCallback(
    async (id: string, enabled: boolean) => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/workspaces/webhooks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        if (!response.ok) {
          throw new Error("Failed to update web hook");
        }

        await refresh();
        return true;
      } catch {
        setError("Unable to update web hook.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const testWebhook = useCallback(async (id: string) => {
    setTestingWebhookId(id);
    setWebhookTestMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/webhooks/${id}/test`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        status?: number;
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(body?.error ?? "Webhook test failed");
      }
      setWebhookTestMessage(`Test delivered (HTTP ${body?.status ?? 200}).`);
      return true;
    } catch (testError) {
      setWebhookTestMessage(
        testError instanceof Error ? testError.message : "Webhook test failed.",
      );
      return false;
    } finally {
      setTestingWebhookId(null);
    }
  }, []);

  return {
    fields,
    tokens,
    webhooks,
    loading,
    error,
    saving,
    fieldSaving,
    updateField,
    createToken,
    deleteToken,
    createWebhook,
    deleteWebhook,
    toggleWebhook,
    testWebhook,
    testingWebhookId,
    webhookTestMessage,
  };
}
