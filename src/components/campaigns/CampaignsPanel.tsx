"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Megaphone, Search, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCampaigns } from "@/hooks/useCampaigns";
import { CampaignRecipientsModal } from "@/components/campaigns/CampaignRecipientsModal";
import { CampaignDetailModal } from "@/components/campaigns/CampaignDetailModal";
import type { Campaign, CampaignStatus, CampaignType } from "@/types/campaigns";
import { isCampaignsTagsPath } from "@/lib/campaigns-routes";
import { DOCS_CAMPAIGNS_URL } from "@/lib/docs-links";
import { appCampaignsPath } from "@/lib/marketing-paths";

const STATUS_CYCLE: CampaignStatus[] = ["draft", "scheduled", "paused", "sent"];

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-[#F4F4F5] text-[#5D6B98]",
  scheduled: "bg-[#E8F0FE] text-[#1972F5]",
  sent: "bg-[#F2F8F2] text-[#5DAC5D]",
  paused: "bg-[#FDF4EC] text-[#E07415]",
};

function CampaignIllustration() {
  return (
    <div className="relative flex h-[132px] w-[138px] items-center justify-center">
      <div className="absolute inset-0 rounded-2xl bg-[#E0E7F0]/50" />
      <div className="relative flex h-20 w-24 flex-col overflow-hidden rounded-lg border border-[#D7DCE5] bg-white shadow-sm">
        <div className="h-5 bg-[#E0E7F0]" />
        <div className="flex flex-1 flex-col gap-1.5 p-2">
          <div className="h-2 w-full rounded bg-[#E0E7F0]" />
          <div className="h-2 w-4/5 rounded bg-[#E0E7F0]" />
          <div className="mt-auto flex justify-end">
            <div className="h-6 w-6 rounded-full bg-[#1972F5]/20" />
          </div>
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#1972F5] text-white shadow-md">
        <Megaphone size={18} />
      </div>
    </div>
  );
}

function CampaignRow({
  campaign,
  sending,
  deleting,
  updatingStatus,
  onSend,
  onDelete,
  onRename,
  onManageRecipients,
  onViewDetails,
  onToggleStatus,
}: {
  campaign: Campaign;
  sending: boolean;
  deleting: boolean;
  updatingStatus: boolean;
  onSend: (campaignId: string) => void;
  onDelete: (campaignId: string) => void;
  onRename: (campaign: Campaign) => void;
  onManageRecipients: (campaign: Campaign) => void;
  onViewDetails: (campaignId: string) => void;
  onToggleStatus: (campaignId: string, status: CampaignStatus) => void;
}) {
  const canSend = campaign.status === "draft" && campaign.contactCount > 0;
  const nextStatus =
    STATUS_CYCLE[(STATUS_CYCLE.indexOf(campaign.status) + 1) % STATUS_CYCLE.length];

  return (
    <tr className="border-b border-[#F4F4F5] text-sm font-semibold text-[#1C293B]">
      <td className="px-8 py-3">
        <button
          type="button"
          onClick={() => onRename(campaign)}
          className="text-left hover:text-[#1972F5]"
        >
          {campaign.name}
        </button>
      </td>
      <td className="px-3 py-3">
        <button
          type="button"
          disabled={updatingStatus}
          onClick={() => onToggleStatus(campaign.id, nextStatus)}
          className={cn(
            "inline-flex rounded px-2 py-0.5 text-xs font-semibold capitalize disabled:opacity-60",
            STATUS_STYLES[campaign.status],
          )}
        >
          {updatingStatus ? "…" : campaign.status}
        </button>
      </td>
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={() => onManageRecipients(campaign)}
          className="text-[#1972F5] hover:underline"
        >
          {campaign.contactCount}
        </button>
      </td>
      <td className="px-3 py-3">{campaign.lastUpdate}</td>
      <td className="px-8 py-3 text-right">
        <div className="inline-flex items-center gap-2">
          {canSend ? (
            <button
              type="button"
              disabled={sending}
              onClick={() => onSend(campaign.id)}
              className="rounded bg-[#1972F5] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onViewDetails(campaign.id)}
            className="text-xs font-semibold text-[#1972F5]"
          >
            Details
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(campaign.id)}
            className="text-xs font-semibold text-[#EF4444] disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CampaignsPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const [tagFilter, setTagFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recipientsCampaign, setRecipientsCampaign] = useState<Campaign | null>(null);
  const [detailCampaignId, setDetailCampaignId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [createType, setCreateType] = useState<CampaignType>("one-shot");
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const isTagsView = isCampaignsTagsPath(pathname);
  const { campaigns, loading, error, reload } = useCampaigns(pathname, searchQuery, tagFilter);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTagFilter(params.get("tag") ?? "");
  }, [pathname]);

  useEffect(() => {
    if (!actionsOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionsOpen]);

  useEffect(() => {
    if (!isTagsView) {
      setTags([]);
      return;
    }

    let cancelled = false;
    setTagsLoading(true);
    setTagsError(null);

    void (async () => {
      try {
        const params = new URLSearchParams();
        const query = searchQuery.trim();
        if (query) params.set("q", query);
        const response = await fetch(`/api/campaigns/tags?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to load tags");
        const data = (await response.json()) as { tags: string[] };
        if (!cancelled) setTags(data.tags);
      } catch {
        if (!cancelled) {
          setTagsError("Unable to load campaign tags.");
          setTags([]);
        }
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isTagsView, searchQuery]);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setSearchQuery(searchInput);
    }
  };

  const handleCreateCampaign = async () => {
    setCreating(true);
    try {
      let contactIds: string[] | undefined;
      const contactsResponse = await fetch("/api/contacts");
      if (contactsResponse.ok) {
        const contactsData = (await contactsResponse.json()) as {
          contacts?: { id: string }[];
        };
        const firstContactId = contactsData.contacts?.[0]?.id;
        if (firstContactId) {
          contactIds = [firstContactId];
        }
      }

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Campaign ${new Date().toLocaleDateString()}`,
          type: createType,
          ...(contactIds ? { contactIds } : {}),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create campaign");
      }
      await reload();
    } finally {
      setCreating(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    setSendingId(campaignId);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to send campaign");
      }
      await reload();
    } finally {
      setSendingId(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    setDeletingId(campaignId);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete campaign");
      }
      await reload();
    } finally {
      setDeletingId(null);
    }
  };

  const handleRenameCampaign = async (campaign: Campaign) => {
    const nextName = window.prompt("Campaign name", campaign.name)?.trim();
    if (!nextName || nextName === campaign.name) return;

    const response = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    });
    if (!response.ok) return;
    await reload();
  };

  const handleToggleStatus = async (campaignId: string, status: CampaignStatus) => {
    setUpdatingStatusId(campaignId);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      await reload();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const showEmpty = !loading && !error && campaigns.length === 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-[#F4F4F5] px-8 py-4">
        <div className="flex items-center gap-2">
          <Megaphone size={20} className="text-[#2C405A]" strokeWidth={1.75} />
          <h1 className="text-base font-semibold text-[#2C405A]">
            {isTagsView ? "All Tags" : "Campaigns"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={createType}
            onChange={(event) => setCreateType(event.target.value as CampaignType)}
            className="h-[37px] rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-semibold text-[#1C293B]"
          >
            <option value="one-shot">One-Shot</option>
            <option value="automated">Automated</option>
          </select>
          <div className="flex h-9 w-[250px] items-center gap-2 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2">
            <Search size={18} className="shrink-0 text-[#828EA1]" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search"
              className="w-full bg-transparent text-sm text-[#1C293B] outline-none placeholder:text-[#828EA1]"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              window.open(DOCS_CAMPAIGNS_URL, "_blank", "noopener,noreferrer")
            }
            className="h-[37px] rounded bg-[#1972F5] px-4 text-sm font-semibold text-white"
          >
            Documentation
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleCreateCampaign()}
            className="h-[37px] rounded bg-[#1C293B] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {creating ? "Creating…" : "New Campaign"}
          </button>
          <div ref={actionsRef} className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen((open) => !open)}
              className="inline-flex h-[37px] items-center gap-1 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-semibold text-[#333E4F]"
            >
              Actions
              <ChevronDown size={16} />
            </button>
            {actionsOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-[#E8EAEB] bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    router.push(appCampaignsPath("templates/all"));
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
                >
                  View templates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    router.push(appCampaignsPath("tags/all"));
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
                >
                  View tags
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    void reload();
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
                >
                  Refresh list
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto bg-[#FBFBFB]">
        {isTagsView ? (
          tagsLoading ? (
            <p className="px-8 py-12 text-center text-sm text-[#828EA1]">Loading tags…</p>
          ) : tagsError ? (
            <p className="px-8 py-12 text-center text-sm text-[#828EA1]">{tagsError}</p>
          ) : tags.length === 0 ? (
            <p className="px-8 py-12 text-center text-sm text-[#828EA1]">No tags match your search.</p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#FBFBFB]">
                <tr className="border-b border-[#F4F4F5] text-[13.5px] font-semibold text-[#75869C]">
                  <th className="px-8 py-2">Tag</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr
                    key={tag}
                    onClick={() =>
                      router.push(`${appCampaignsPath("types/all")}?tag=${encodeURIComponent(tag)}`)
                    }
                    className="cursor-pointer border-b border-[#F4F4F5] text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
                  >
                    <td className="px-8 py-3">
                      <span className="inline-flex items-center gap-2">
                        <Tag size={14} className="text-[#1972F5]" />
                        {tag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <>
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#FBFBFB]">
                <tr className="border-b border-[#F4F4F5] text-[13.5px] font-semibold text-[#75869C]">
                  <th className="px-8 py-2">Campaign Name</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Contacts</th>
                  <th className="px-3 py-2">Last Update</th>
                  <th className="px-8 py-2 text-right">Actions</th>
                </tr>
              </thead>
              {!showEmpty && !loading && !error && (
                <tbody>
                  {campaigns.map((campaign) => (
                    <CampaignRow
                      key={campaign.id}
                      campaign={campaign}
                      sending={sendingId === campaign.id}
                      deleting={deletingId === campaign.id}
                      updatingStatus={updatingStatusId === campaign.id}
                      onSend={(campaignId) => void handleSendCampaign(campaignId)}
                      onDelete={(campaignId) => void handleDeleteCampaign(campaignId)}
                      onRename={(item) => void handleRenameCampaign(item)}
                      onManageRecipients={setRecipientsCampaign}
                      onViewDetails={setDetailCampaignId}
                      onToggleStatus={(campaignId, status) =>
                        void handleToggleStatus(campaignId, status)
                      }
                    />
                  ))}
                </tbody>
              )}
            </table>

            {loading ? (
              <p className="px-8 py-12 text-center text-sm text-[#828EA1]">Loading campaigns…</p>
            ) : error ? (
              <p className="px-8 py-12 text-center text-sm text-[#828EA1]">{error}</p>
            ) : showEmpty ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center px-8 py-12 text-center">
                <CampaignIllustration />
                <h2 className="mt-6 text-lg font-semibold text-[#1C293B]">
                  You have no campaign.
                </h2>
                <p className="mt-2 max-w-md text-sm leading-5 text-[#495462]">
                  Campaigns are used to send emails to targeted contacts. Create your
                  first one!
                </p>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => void handleCreateCampaign()}
                  className="mt-6 h-[37px] rounded bg-[#1C293B] px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {creating ? "Creating…" : "New Campaign"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <CampaignRecipientsModal
        campaignId={recipientsCampaign?.id ?? ""}
        campaignName={recipientsCampaign?.name ?? ""}
        open={Boolean(recipientsCampaign)}
        onClose={() => setRecipientsCampaign(null)}
        onUpdated={() => void reload()}
      />

      <CampaignDetailModal
        campaignId={detailCampaignId}
        onClose={() => setDetailCampaignId(null)}
        onSend={async (campaignId) => {
          await handleSendCampaign(campaignId);
          setDetailCampaignId(null);
        }}
        onManageRecipients={(campaign) => setRecipientsCampaign(campaign)}
        sending={sendingId !== null}
      />
    </div>
  );
}
