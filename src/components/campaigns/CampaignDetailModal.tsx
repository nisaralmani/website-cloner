"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Campaign } from "@/types/campaigns";

type CampaignDetailModalProps = {
  campaignId: string | null;
  onClose: () => void;
  onSend?: (campaignId: string) => Promise<void>;
  onManageRecipients?: (campaign: Campaign) => void;
  sending?: boolean;
};

export function CampaignDetailModal({
  campaignId,
  onClose,
  onSend,
  onManageRecipients,
  sending = false,
}: CampaignDetailModalProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) throw new Error("Failed to load campaign");
        const data = (await response.json()) as { campaign: Campaign };
        if (!cancelled) setCampaign(data.campaign);
      } catch {
        if (!cancelled) {
          setError("Unable to load campaign.");
          setCampaign(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (!campaignId) return null;

  const canSend =
    campaign?.status === "draft" && campaign.contactCount > 0 && Boolean(onSend);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F4F4F5] px-5 py-4">
          <h2 className="text-base font-semibold text-[#1C293B]">Campaign Details</h2>
          <button type="button" onClick={onClose} className="text-[#828EA1]" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm">
          {loading ? (
            <p className="text-[#828EA1]">Loading campaign…</p>
          ) : error ? (
            <p className="text-[#828EA1]">{error}</p>
          ) : campaign ? (
            <>
              <div>
                <p className="text-xs font-semibold uppercase text-[#75869C]">Name</p>
                <p className="font-semibold text-[#1C293B]">{campaign.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#75869C]">Type</p>
                <p className="capitalize text-[#1C293B]">{campaign.type}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#75869C]">Status</p>
                <p className="capitalize text-[#1C293B]">{campaign.status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#75869C]">Contacts</p>
                <p className="text-[#1C293B]">{campaign.contactCount}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#75869C]">Last Update</p>
                <p className="text-[#1C293B]">{campaign.lastUpdate}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {onManageRecipients ? (
                  <button
                    type="button"
                    onClick={() => {
                      onManageRecipients(campaign);
                      onClose();
                    }}
                    className="rounded border border-[#E8EAEB] px-3 py-2 text-sm font-semibold text-[#1972F5]"
                  >
                    Manage recipients
                  </button>
                ) : null}
                {canSend ? (
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void onSend?.(campaign.id)}
                    className="rounded bg-[#1972F5] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Send campaign"}
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
