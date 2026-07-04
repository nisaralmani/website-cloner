export type WorkspaceDataLimitKey = "campaignRecipients" | "operators" | "filesUploaded";

export type WorkspaceDataTraining = {
  magicReplyNeverTrained: boolean;
  magicReplyLastTrainedAt: string | null;
  knowledgeBaseEnabled: boolean;
  helpdeskArticleCount: number;
  knowledgeBaseDescription: string;
};

export type WorkspaceDataLimit = {
  key: WorkspaceDataLimitKey;
  label: string;
  main: string;
  secondary?: string;
  progress: number;
  tone: "blue" | "black";
  limit: number;
  used: number;
};

export type WorkspaceDataContract = {
  label: string;
  signed: boolean;
  signedAt: string | null;
  viewHref: string;
};

export type WorkspaceDataPayload = {
  training: WorkspaceDataTraining;
  limits: WorkspaceDataLimit[];
  contract: WorkspaceDataContract;
};
