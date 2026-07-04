export type WorkspaceApiToken = {
  id: string;
  label: string;
  tokenPreview: string;
  createdAt: string;
};

export type WorkspaceApiTokenCreated = WorkspaceApiToken & {
  plainToken: string;
};

export type WorkspaceWebhook = {
  id: string;
  url: string;
  enabled: boolean;
  events: string[];
  createdAt: string;
};

export type WorkspaceApiTokensPayload = {
  tokens: WorkspaceApiToken[];
};

export type WorkspaceWebhooksPayload = {
  webhooks: WorkspaceWebhook[];
};
