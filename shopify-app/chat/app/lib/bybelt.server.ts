const DEFAULT_CHAT_ORIGIN = "https://chat.bybelt.com";
const DEFAULT_INBOX_URL = "https://chat.bybelt.com";
const CHAT_EMBED_BLOCK_HANDLE = "chat-embed";

export function bybeltChatOrigin(): string {
  return process.env.BYBELT_CHAT_ORIGIN?.replace(/\/$/, "") || DEFAULT_CHAT_ORIGIN;
}

export function bybeltInboxUrl(): string {
  return process.env.BYBELT_INBOX_URL?.replace(/\/$/, "") || DEFAULT_INBOX_URL;
}

export function bybeltEmbedScriptUrl(): string {
  return `${bybeltChatOrigin()}/embed.js`;
}

export function themeEmbedActivateUrl(shop: string, apiKey: string): string {
  const host = shop.includes(".") ? shop : `${shop}.myshopify.com`;
  const params = new URLSearchParams({
    context: "apps",
    activateAppId: `${apiKey}/${CHAT_EMBED_BLOCK_HANDLE}`,
  });
  return `https://${host}/admin/themes/current/editor?${params.toString()}`;
}

export type BybeltShopSettings = {
  workspaceId: string;
  domain: string;
  widgetEnabled: boolean;
};

export function parseWidgetEnabled(value: string | null | undefined): boolean {
  if (value == null || value === "") return true;
  return value === "true" || value === "1";
}
