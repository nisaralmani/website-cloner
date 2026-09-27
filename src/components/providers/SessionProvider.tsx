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
import { APP_INBOX_PATH, APP_WIDGET_PATH } from "@/lib/marketing-paths";

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
    if (typeof window !== "undefined" && window.location.pathname.startsWith(APP_WIDGET_PATH)) {
      // The visitor-facing chat embed has no operator session — never redirect it to /login.
      setState({ ...emptyState, loading: false });
      return;
    }
    try {
      const response = await fetch("/api/auth/session");
      if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
          const { pathname, search } = window.location;
          if (isAuthPagePath(pathname)) {
            setState({ ...emptyState, loading: false });
            return;
          }

          const returnTo = `${pathname}${search}`;
          window.location.replace(loginUrlWithNext(returnTo));
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

      setState(applySessionPayload(data));
    } catch {
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
