"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { SessionState, SessionUser, SessionWorkspace } from "@/types/session";
import { isAuthPagePath, loginUrlWithNext } from "@/lib/auth/safe-redirect";
import { APP_INBOX_PATH } from "@/lib/marketing-paths";
import { agentDebugLog } from "@/lib/debug-agent-log";

type SessionContextValue = SessionState & {
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  updatePresence: (status: "online" | "offline") => Promise<boolean>;
  switchWorkspace: (workspaceId: string) => Promise<boolean>;
  createWorkspace: (name: string, domain: string) => Promise<boolean>;
};

const emptyState: SessionState = {
  loading: true,
  authenticated: false,
  user: null,
  workspace: null,
  workspaces: [],
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(emptyState);

  const applySessionPayload = useCallback(
    (data: {
      authenticated: boolean;
      user?: SessionUser;
      workspace?: SessionWorkspace;
      workspaces?: SessionWorkspace[];
    }) => ({
      loading: false,
      authenticated: Boolean(data.authenticated && data.user && data.workspace),
      user: data.user ?? null,
      workspace: data.workspace ?? null,
      workspaces: data.workspaces ?? (data.workspace ? [data.workspace] : []),
    }),
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (!response.ok) {
        agentDebugLog("SessionProvider.tsx:refresh", "session fetch failed", {
          status: response.status,
        }, "H2");
        if (response.status === 401 && typeof window !== "undefined") {
          const { pathname, search } = window.location;
          if (isAuthPagePath(pathname)) {
            agentDebugLog(
              "SessionProvider.tsx:refresh",
              "401 on auth page — no redirect",
              { pathname },
              "H-loop",
            );
            setState({ ...emptyState, loading: false });
            return;
          }

          const returnTo = `${pathname}${search}`;
          const loginUrl = loginUrlWithNext(returnTo);
          agentDebugLog(
            "SessionProvider.tsx:refresh",
            "401 redirect to login",
            { returnTo, loginUrl },
            "H-loop",
          );
          window.location.replace(loginUrl);
          return;
        }
        setState({ ...emptyState, loading: false });
        return;
      }

      const data = (await response.json()) as {
        authenticated: boolean;
        user?: SessionUser;
        workspace?: SessionWorkspace;
        workspaces?: SessionWorkspace[];
      };

      agentDebugLog("SessionProvider.tsx:refresh", "session payload", {
        authenticated: data.authenticated,
        workspaceId: data.workspace?.id ?? null,
        workspaceName: data.workspace?.name ?? null,
      }, "H2");

      setState(applySessionPayload(data));
    } catch (sessionError) {
      agentDebugLog("SessionProvider.tsx:refresh", "session fetch threw", {
        message: sessionError instanceof Error ? sessionError.message : "unknown",
      }, "H2");
      setState({ ...emptyState, loading: false });
    }
  }, [applySessionPayload]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = loginUrlWithNext(null);
    }
  }, []);

  const updatePresence = useCallback(async (status: "online" | "offline") => {
    try {
      const response = await fetch("/api/auth/presence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) return false;

      const data = (await response.json()) as { user?: SessionUser };
      if (!data.user) return false;

      setState((current) =>
        current.user && data.user
          ? {
              ...current,
              user: { ...current.user, ...data.user },
            }
          : current,
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      if (state.workspace?.id === workspaceId) return true;

      try {
        const response = await fetch("/api/auth/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        if (!response.ok) return false;

        const data = (await response.json()) as {
          user?: SessionUser;
          workspace?: SessionWorkspace;
          workspaces?: SessionWorkspace[];
        };

        if (!data.workspace) return false;

        setState(applySessionPayload({ authenticated: true, ...data }));
        window.location.assign(APP_INBOX_PATH);
        return true;
      } catch {
        return false;
      }
    },
    [applySessionPayload, state.workspace?.id],
  );

  const createWorkspace = useCallback(
    async (name: string, domain: string) => {
      try {
        const response = await fetch("/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, domain }),
        });
        if (!response.ok) return false;

        const data = (await response.json()) as {
          user?: SessionUser;
          workspace?: SessionWorkspace;
          workspaces?: SessionWorkspace[];
        };

        if (!data.workspace) return false;

        setState(applySessionPayload({ authenticated: true, ...data }));
        window.location.assign(APP_INBOX_PATH);
        return true;
      } catch {
        return false;
      }
    },
    [applySessionPayload],
  );

  const value = useMemo(
    () => ({
      ...state,
      refresh,
      logout,
      updatePresence,
      switchWorkspace,
      createWorkspace,
    }),
    [createWorkspace, logout, refresh, state, switchWorkspace, updatePresence],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
