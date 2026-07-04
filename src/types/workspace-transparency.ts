export type WorkspaceAuditLog = {
  id: string;
  action: string;
  badge: string;
  operatorUserId: string;
  operatorName: string;
  operatorAvatarUrl: string;
  ipAddress: string;
  country: string;
  createdAt: string;
  timeAgoLabel: string;
};

export type TransparencyOperatorOption = {
  userId: string;
  name: string;
};

export type WorkspaceTransparencyPayload = {
  logs: WorkspaceAuditLog[];
  operators: TransparencyOperatorOption[];
  actions: string[];
};
