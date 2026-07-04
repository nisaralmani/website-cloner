import type { CurrentUser, Workspace } from "@/types/inbox";

export type SessionUser = CurrentUser & { id: string };

export type SessionWorkspace = Workspace & { id: string; role?: string };

export type SessionState = {
  loading: boolean;
  authenticated: boolean;
  user: SessionUser | null;
  workspace: SessionWorkspace | null;
  workspaces: SessionWorkspace[];
};
