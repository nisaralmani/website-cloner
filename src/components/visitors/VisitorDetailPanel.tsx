"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Visitor } from "@/types/visitors";
import { PersonGlyph } from "@/components/icons";
import { appInboxConversationPath } from "@/lib/marketing-paths";
import { useSession } from "@/components/providers/SessionProvider";

type VisitorDetailPanelProps = {
  visitor: Visitor | null;
  onClose: () => void;
};

export function VisitorDetailPanel({ visitor, onClose }: VisitorDetailPanelProps) {
  const router = useRouter();
  const { workspace } = useSession();
  const [starting, setStarting] = useState(false);

  if (!visitor) return null;

  const pageUrl =
    workspace?.domain && visitor.currentPage
      ? `https://${workspace.domain}${visitor.currentPage.startsWith("/") ? visitor.currentPage : `/${visitor.currentPage}`}`
      : null;

  const handleStartConversation = async () => {
    setStarting(true);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: visitor.name }),
      });
      if (!response.ok) throw new Error("Failed to start conversation");
      const payload = (await response.json()) as { conversation?: { id: string } };
      if (!payload.conversation?.id) throw new Error("Missing conversation id");
      router.push(appInboxConversationPath(payload.conversation.id));
    } catch {
      window.alert("Unable to start conversation. Try again.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 w-[280px] rounded-lg border border-[#E3E8EF] bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white",
              visitor.avatarGradient,
            )}
          >
            {visitor.initials ? visitor.initials : <PersonGlyph size={18} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1C293B]">{visitor.name}</p>
            <p className="text-xs text-[#828EA1]">{visitor.location}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-[#828EA1]" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <dl className="space-y-2 text-xs">
        <div>
          <dt className="font-semibold uppercase text-[#75869C]">City</dt>
          <dd className="text-[#1C293B]">{visitor.city}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase text-[#75869C]">Country</dt>
          <dd className="text-[#1C293B]">{visitor.country}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase text-[#75869C]">Current page</dt>
          <dd className="flex items-center gap-1.5">
            <span className="truncate text-[#1C293B]">{visitor.currentPage}</span>
            {pageUrl && (
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open visitor's current page"
                title={`Open ${visitor.currentPage}`}
                className="shrink-0 text-[#828EA1] hover:text-[#1972F5]"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase text-[#75869C]">Status</dt>
          <dd className="text-[#1C293B]">{visitor.isActive ? "Active now" : "Online"}</dd>
        </div>
      </dl>
      {visitor.conversationId ? (
        <Link
          href={appInboxConversationPath(visitor.conversationId)}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded bg-[#1972F5] text-sm font-semibold text-white"
        >
          Open in Inbox
        </Link>
      ) : (
        <button
          type="button"
          disabled={starting}
          onClick={() => void handleStartConversation()}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded bg-[#1972F5] text-sm font-semibold text-white disabled:opacity-60"
        >
          {starting ? "Starting…" : "Start conversation"}
        </button>
      )}
    </div>
  );
}
