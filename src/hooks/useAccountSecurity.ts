"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TableRowCell } from "@/lib/settings-data";
import { APP_AUTH_LOGIN_PATH } from "@/lib/marketing-paths";

export type SecuritySession = {
  id: string;
  userAgent: string;
  ipAddress: string;
  country: string;
  whenLabel: string;
  isCurrent: boolean;
  state: "authorized" | "closed";
};

type SecurityPayload = {
  currentSessionId: string | null;
  activeSessions: SecuritySession[];
  loginHistory: SecuritySession[];
};

function activeSessionRows(sessions: SecuritySession[]): TableRowCell[][] {
  return sessions.map((session) => [
    { kind: "text", value: session.userAgent },
    { kind: "location", country: session.country, ip: session.ipAddress },
    { kind: "action", label: "Close session", sessionId: session.id },
  ]);
}

function loginHistoryRows(sessions: SecuritySession[]): TableRowCell[][] {
  return sessions.map((session) => [
    { kind: "dateFrom", when: session.whenLabel, agent: session.userAgent },
    { kind: "location", country: session.country, ip: session.ipAddress },
    {
      kind: "badge",
      value: session.state === "authorized" ? "Authorized" : "Closed",
      tone: session.state === "authorized" ? "green" : "grey",
    },
  ]);
}

export function useAccountSecurity(enabled: boolean) {
  const router = useRouter();
  const [data, setData] = useState<SecurityPayload | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [closingSessionId, setClosingSessionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/auth/sessions");
    if (!response.ok) {
      throw new Error("Failed to load sessions");
    }
    return (await response.json()) as SecurityPayload;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setData(null);
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
          setError("Unable to load security sessions.");
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

  const closeSession = useCallback(
    async (sessionId: string) => {
      setClosingSessionId(sessionId);
      setError(null);

      try {
        const response = await fetch("/api/auth/sessions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!response.ok) {
          throw new Error("Failed to close session");
        }

        const payload = (await response.json()) as SecurityPayload & {
          currentRevoked?: boolean;
        };
        setData(payload);

        if (payload.currentRevoked) {
          router.push(APP_AUTH_LOGIN_PATH);
          router.refresh();
        }

        return true;
      } catch {
        setError("Unable to close session.");
        return false;
      } finally {
        setClosingSessionId(null);
      }
    },
    [router],
  );

  return {
    loading,
    error,
    closingSessionId,
    authorizedRows: data ? activeSessionRows(data.activeSessions) : [],
    historyRows: data ? loginHistoryRows(data.loginHistory) : [],
    closeSession,
  };
}
