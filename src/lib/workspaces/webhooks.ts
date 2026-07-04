import type { workspaceWebhooks } from "@/db/schema";

import { toBooleanFlag, fromBooleanFlag } from "@/lib/auth/flags";

import { parseWebhookEvents } from "@/lib/workspaces/webhook-events";

import type { WorkspaceWebhook } from "@/types/workspace-advanced";



type WebhookRow = typeof workspaceWebhooks.$inferSelect;



export function webhookCountLabel(count: number) {

  return `${count} hook${count === 1 ? "" : "s"}`;

}



export function toWorkspaceWebhook(row: WebhookRow): WorkspaceWebhook {

  return {

    id: row.id,

    url: row.url,

    enabled: toBooleanFlag(row.enabled),

    events: parseWebhookEvents(row.events),

    createdAt: row.createdAt.toISOString(),

  };

}



export function normalizeWebhookUrl(value: string) {

  return value.trim();

}



export function validateWebhookUrl(url: string) {

  if (!url) {

    return "url is required";

  }



  try {

    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {

      return "url must use http or https";

    }

  } catch {

    return "url is invalid";

  }



  return null;

}



export function defaultMockWebhookUrl() {

  return "https://example.com/webhooks/bybelt";

}



export function enabledWebhookFlag(enabled: boolean) {

  return fromBooleanFlag(enabled);

}


