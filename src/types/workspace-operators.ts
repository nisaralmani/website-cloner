export type WorkspaceOperator = {
  userId: string;
  name: string;
  self: boolean;
  email: string;
  avatarUrl: string;
  role: string;
  online: boolean;
};

export type WorkspaceOperatorsPayload = {
  operators: WorkspaceOperator[];
  supportOnline: boolean;
};
