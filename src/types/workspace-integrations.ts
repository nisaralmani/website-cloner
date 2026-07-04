export type IntegrationChannel = {
  name: string;
  image: string;
};

export type IntegrationCategory = {
  title: string;
  channels: IntegrationChannel[];
};

export type WorkspaceIntegrationsPayload = {
  workspaceId: string;
  intro: string;
  footerButton: string;
  categories: IntegrationCategory[];
  htmlSnippet: string;
  scriptUrl: string;
  shopify?: {
    installUrl: string;
    linked: boolean;
    shop?: string;
    shopAdminUrl?: string;
    widgetEnabled?: boolean;
    lastContactSyncAt?: string | null;
    lastContactSyncCreated?: number | null;
    lastContactSyncUpdated?: number | null;
    lastContactSyncTotal?: number | null;
    webhookTopicCount?: number;
  };
};