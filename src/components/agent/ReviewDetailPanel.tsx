"use client";

import { useState } from "react";

import { Bot, Check, Edit2, Play, RefreshCcw, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewQueueItem } from "@/components/agent/ReviewQueue";

type ReviewDetailPanelProps = {
  review: ReviewQueueItem;
  onClose: () => void;
  onUpdated: () => void;
};

export default function ReviewDetailPanel({ review, onClose, onUpdated }: ReviewDetailPanelProps) {
  const [draftText, setDraftText] = useState(review.draftText || "");
  const [isEditing, setIsEditing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performAction = async (
    action: string,
    method: "POST" = "POST",
    body?: { draftText: string },
  ) => {
    setLoadingAction(action);
    setError(null);
    try {
      const res = await fetch(`/api/ai/reviews/${review.id}/${action}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${action}`);
      }
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApprove = () => performAction("approve");
  const handleReject = () => performAction("reject");
  const handlePublish = () => performAction("publish");
  const handleReopen = () => performAction("reopen");
  const handleSaveEdit = async () => {
    await performAction("edit", "POST", { draftText });
    setIsEditing(false);
  };

  return (
    <div className="absolute inset-y-0 right-0 z-40 w-96 border-l border-[#E8EAEB] bg-white shadow-2xl flex flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-[#F4F4F5] px-6 py-4">
        <h2 className="text-base font-bold text-[#1C293B] flex items-center gap-2">
          <Bot size={18} className="text-[#1972F5]" /> AI Review Detail
        </h2>
        <button onClick={onClose} className="text-[#828EA1] hover:text-[#1C293B]">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {error && <div className="rounded bg-[#FDE8E8] p-3 text-sm text-[#EF4444]">{error}</div>}

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#828EA1] mb-2">Context</h3>
          <div className="rounded border border-[#E8EAEB] bg-[#F8F9F9] p-3 text-sm text-[#5D6B98]">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-[#1C293B]">Reason:</span>
              <span className="capitalize">{review.reason}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-[#1C293B]">Confidence:</span>
              <span>{review.confidence}%</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-[#1C293B]">Status:</span>
              <span className="capitalize">{review.state.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-[#1C293B]">Created:</span>
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#828EA1]">AI Draft</h3>
            {!isEditing && review.state === "pending_review" && (
              <button onClick={() => setIsEditing(true)} className="text-xs text-[#1972F5] hover:underline flex items-center gap-1">
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full min-h-[160px] rounded border border-[#1972F5] bg-white p-3 text-sm text-[#1C293B] focus:outline-none focus:ring-2 focus:ring-[#1972F5]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setDraftText(review.draftText || "");
                  }}
                  className="rounded px-3 py-1.5 text-xs font-bold text-[#5D6B98] hover:bg-[#F4F4F5]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loadingAction !== null}
                  className="rounded bg-[#1972F5] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#155fc7]"
                >
                  {loadingAction === "edit" ? "Saving..." : "Save Edit"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded border border-[#E8EAEB] bg-white p-4 text-sm text-[#1C293B] whitespace-pre-wrap">
              {review.draftText || <span className="text-[#828EA1] italic">No draft available.</span>}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#F4F4F5] bg-[#F8F9F9] p-4 flex flex-col gap-2">
        {review.state === "pending_review" && (
          <>
            <button
              onClick={handleApprove}
              disabled={loadingAction !== null}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#1972F5] py-2 text-sm font-bold text-white shadow-sm hover:bg-[#155fc7] disabled:opacity-50"
            >
              <Check size={16} /> Approve
            </button>
            <button
              onClick={handleReject}
              disabled={loadingAction !== null}
              className="flex w-full items-center justify-center gap-2 rounded border border-[#E8EAEB] bg-white py-2 text-sm font-bold text-[#EF4444] shadow-sm hover:bg-[#FDE8E8] disabled:opacity-50"
            >
              <X size={16} /> Reject
            </button>
          </>
        )}
        {review.state === "approved" && (
          <button
            onClick={handlePublish}
            disabled={loadingAction !== null}
            className="flex w-full items-center justify-center gap-2 rounded bg-[#5DAC5D] py-2 text-sm font-bold text-white shadow-sm hover:bg-[#4d934d] disabled:opacity-50"
          >
            <Send size={16} /> Publish Reply
          </button>
        )}
        {(review.state === "approved" || review.state === "rejected" || review.state === "published") && (
          <button
            onClick={handleReopen}
            disabled={loadingAction !== null}
            className="flex w-full items-center justify-center gap-2 rounded border border-[#E8EAEB] bg-white py-2 text-sm font-bold text-[#5D6B98] shadow-sm hover:bg-[#F4F4F5] disabled:opacity-50"
          >
            <RefreshCcw size={16} /> Reopen
          </button>
        )}
      </div>
    </div>
  );
}
