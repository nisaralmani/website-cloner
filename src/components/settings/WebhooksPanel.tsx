"use client";

import { Globe, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWebhookEventLabel } from "@/lib/workspaces/webhook-events";
import type { WorkspaceWebhook } from "@/types/workspace-advanced";

type WebhooksPanelProps = {
  webhooks: WorkspaceWebhook[];
  saving?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onDelete: (id: string) => Promise<boolean>;
  onToggle: (id: string, enabled: boolean) => Promise<boolean>;
  onTest?: (id: string) => Promise<boolean>;
  testingId?: string | null;
  testMessage?: string | null;
};

export function WebhooksPanel({
  webhooks,
  saving,
  emptyTitle,
  emptyDescription,
  onDelete,
  onToggle,
  onTest,
  testingId,
  testMessage,
}: WebhooksPanelProps) {
  if (webhooks.length === 0) {
    return (
      <div className="flex flex-col items-center rounded border border-[#E8EAEB] px-2.5 py-3.5 text-center">
        <Globe size={20} className="mb-2 text-[#1c293b]" strokeWidth={1.75} />
        <p className="text-sm font-medium text-[#1c293b]">{emptyTitle}</p>
        <p className="mt-1 text-sm text-[#75869c]">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      {testMessage ? (
        <p className="mb-2 text-sm font-semibold text-[#39A746]">{testMessage}</p>
      ) : null}
      <ul className="rounded border border-[#E8EAEB]">
      {webhooks.map((webhook) => (
        <li
          key={webhook.id}
          className="flex items-start justify-between gap-4 border-b border-[#E8EAEB] px-3 py-3 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#1c293b]">{webhook.url}</p>
            {webhook.events.length > 0 ? (
              <p className="mt-1 text-xs text-[#75869c]">
                {webhook.events.map(formatWebhookEventLabel).join(" · ")}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onTest ? (
              <button
                type="button"
                disabled={saving || testingId === webhook.id}
                onClick={() => void onTest(webhook.id)}
                className="rounded border border-[#E8EAEB] px-2 py-1 text-xs font-semibold text-[#1972F5] disabled:opacity-60"
              >
                {testingId === webhook.id ? "Testing…" : "Test"}
              </button>
            ) : null}
            <button
              type="button"
              role="switch"
              aria-checked={webhook.enabled}
              disabled={saving}
              onClick={() => void onToggle(webhook.id, !webhook.enabled)}
              className={cn(
                "relative h-6 w-[42px] rounded-[20px] transition-colors",
                webhook.enabled ? "bg-[#1972F5]" : "bg-[#F4F4F5]",
                saving && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full transition-all",
                  webhook.enabled ? "left-[22px] bg-white" : "left-1 bg-[#bbbfc4]",
                )}
              />
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onDelete(webhook.id)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded border border-[#E8EAEB] text-[#606976]",
                saving && "opacity-60",
              )}
              aria-label={`Delete ${webhook.url}`}
            >
              <Trash2 size={15} strokeWidth={1.75} />
            </button>
          </div>
        </li>
      ))}
    </ul>
    </>
  );
}
