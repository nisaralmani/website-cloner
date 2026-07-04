export type WorkspaceProfileFieldKey =
  | "name"
  | "domain"
  | "contactEmail"
  | "contactPhone"
  | "contactMessenger"
  | "contactTelegram"
  | "contactTwitter"
  | "contactWhatsapp"
  | "contactInstagram";

export type WorkspaceProfile = {
  name: string;
  domain: string;
  logoUrl: string;
  initials: string;
  contactEmail: string;
  contactPhone: string;
  contactMessenger: string;
  contactTelegram: string;
  contactTwitter: string;
  contactWhatsapp: string;
  contactInstagram: string;
};

export const WORKSPACE_FIELD_BY_LABEL: Record<string, WorkspaceProfileFieldKey> = {
  Domain: "domain",
  Name: "name",
  Email: "contactEmail",
  Phone: "contactPhone",
  Messenger: "contactMessenger",
  Telegram: "contactTelegram",
  "X (Twitter)": "contactTwitter",
  WhatsApp: "contactWhatsapp",
  Instagram: "contactInstagram",
};

export function workspaceFieldKeyForLabel(label: string): WorkspaceProfileFieldKey | null {
  return WORKSPACE_FIELD_BY_LABEL[label] ?? null;
}
