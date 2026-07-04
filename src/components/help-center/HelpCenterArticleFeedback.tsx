"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { PUBLIC_HELPDESK_DOMAIN, publicHelpdeskArticleHelpfulApiPath } from "@/lib/public-helpdesk";

export function HelpCenterArticleFeedback({
  articleId,
  initialHelpfulCount,
}: {
  articleId: string;
  initialHelpfulCount: number;
}) {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [voted, setVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVote() {
    if (voted || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(publicHelpdeskArticleHelpfulApiPath(articleId, PUBLIC_HELPDESK_DOMAIN), { method: "POST" },
      );
      if (!response.ok) {
        throw new Error("Unable to submit feedback.");
      }
      const data = (await response.json()) as { helpfulCount: number };
      setHelpfulCount(data.helpfulCount);
      setVoted(true);
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : "Unable to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
      <p className="text-sm font-semibold text-[#0f172a]">Was this article helpful?</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={voted || submitting}
          onClick={() => void handleVote()}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1972F5] px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          <ThumbsUp size={16} aria-hidden />
          {submitting ? "Submitting…" : voted ? "Thanks!" : "Yes, it helped"}
        </button>
        <span className="text-sm text-[#64748b]">{helpfulCount} found this helpful</span>
      </div>
      {error ? <p className="mt-2 text-sm text-[#EF4444]">{error}</p> : null}
    </div>
  );
}
