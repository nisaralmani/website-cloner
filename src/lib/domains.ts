/** Hostname routing for multi-domain Bybelt deployment. */
export const APP_HOST = "chat.bybelt.com";
export const MARKETING_HOSTS = ["www.bybelt.com", "bybelt.com"] as const;
export const HELP_HOST = "help.bybelt.com";
export const DOCS_HOST = "docs.bybelt.com";
export const STATUS_HOST = "status.bybelt.com";

export const APP_ORIGIN = `https://${APP_HOST}`;
export const MARKETING_ORIGIN = "https://www.bybelt.com";
export const HELP_ORIGIN = `https://${HELP_HOST}`;
export const DOCS_ORIGIN = `https://${DOCS_HOST}`;
export const STATUS_ORIGIN = `https://${STATUS_HOST}`;

export function normalizeHost(hostHeader: string | null): string {
  return (hostHeader ?? "").split(":")[0]?.toLowerCase() ?? "";
}

export function isMarketingHost(host: string): boolean {
  return (MARKETING_HOSTS as readonly string[]).includes(host);
}

export function isAppHost(host: string): boolean {
  if (host === APP_HOST) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
}

export function isHelpHost(host: string): boolean {
  return host === HELP_HOST;
}

export function isDocsHost(host: string): boolean {
  return host === DOCS_HOST;
}

export function isStatusHost(host: string): boolean {
  return host === STATUS_HOST;
}
