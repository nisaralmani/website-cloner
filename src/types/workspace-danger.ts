export type WorkspaceDangerStatus = {
  canLeave: boolean;
  canDelete: boolean;
  leaveBlockedReason: string | null;
  deleteBlockedReason: string | null;
  isOwner: boolean;
  workspaceCount: number;
};

export type WorkspaceDangerSessionPayload = {
  workspace: {
    id: string;
    name: string;
    domain: string;
    initials: string;
    logoUrl: string | null;
  };
  workspaces: Array<{
    id: string;
    name: string;
    domain: string;
    initials: string;
    logoUrl: string | null;
    role: string;
  }>;
  user: {
    id: string;
    email: string;
    name: string;
  };
};
