"use client";

import { useEffect, useState } from "react";
import { Bot, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import ReviewDetailPanel from "./ReviewDetailPanel";

// We'll define a simple type for the frontend representation of a review
export type ReviewQueueItem = {
  id: string;
  conversationId: string;
  state: "pending_review" | "approved" | "rejected" | "edited" | "published";
  createdAt: string;
  reason: string;
  draftText?: string;
  confidence: number;
};

const STATE_STYLES: Record<string, string> = {
  pending_review: "bg-[#FDF4EC] text-[#E07415]",
  approved: "bg-[#E8F0FE] text-[#1972F5]",
  published: "bg-[#F2F8F2] text-[#5DAC5D]",
  rejected: "bg-[#FDE8E8] text-[#EF4444]",
};

export default function ReviewQueue() {
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewQueueItem["state"] | "all">("pending_review");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const reloadReviews = () => {
    setLoading(true);
    fetch("/api/ai/reviews")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load reviews");
        return res.json();
      })
      .then((data: { reviews: ReviewQueueItem[] }) => {
        setReviews(data.reviews || []);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error loading reviews");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    // reloadReviews synchronously calls setLoading(true) before its async
    // fetch chain; on mount that's a no-op (loading already starts true —
    // see useState(true) above), and the manual-refresh path (onUpdated
    // below) needs that same reset, so it's kept in the shared function
    // rather than duplicated.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reloadReviews();
  }, []);

  const filteredReviews = reviews.filter((review) => {
    if (statusFilter !== "all" && review.state !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!review.reason?.toLowerCase().includes(q) && !review.draftText?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const selectedReview = reviews.find((r) => r.id === selectedReviewId);

  return (
    <div className="relative flex h-full flex-col bg-white overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-[#F4F4F5] px-8 py-5">
        <h1 className="text-xl font-bold text-[#1C293B]">AI Reviews</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#828EA1]" size={16} />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 rounded bg-[#F4F6FB] pl-9 pr-3 text-sm font-semibold text-[#1C293B] placeholder:text-[#828EA1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1972F5]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ReviewQueueItem["state"] | "all")
            }
            className="h-9 rounded border border-[#E8EAEB] bg-white px-3 text-sm font-semibold text-[#1C293B] outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#F8F9F9] p-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-[#E8EAEB] bg-white shadow-sm">
          {error ? (
            <div className="p-8 text-center text-[#EF4444]">{error}</div>
          ) : loading ? (
            <div className="p-8 text-center text-[#828EA1]">Loading reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F6FB] text-[#828EA1]">
                <Bot size={32} />
              </div>
              <p className="mt-4 text-base font-semibold text-[#1C293B]">No reviews found</p>
              <p className="mt-1 text-sm text-[#5D6B98]">
                {statusFilter === "pending_review" ? "All caught up! No pending AI replies." : "Try adjusting your filters."}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#F4F4F5] bg-[#F8F9F9] text-xs font-bold uppercase tracking-wide text-[#828EA1]">
                  <th className="px-6 py-3">Created</th>
                  <th className="px-3 py-3">Conversation</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Confidence</th>
                  <th className="px-3 py-3 w-1/2">Reason & Draft</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr 
                    key={review.id} 
                    onClick={() => setSelectedReviewId(review.id)}
                    className={cn(
                      "border-b border-[#F4F4F5] text-sm font-semibold text-[#1C293B] hover:bg-[#F8F9F9] cursor-pointer transition-colors",
                      selectedReviewId === review.id ? "bg-[#F4F6FB]" : ""
                    )}
                  >
                    <td className="px-6 py-4 text-[#5D6B98]">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-4">
                      <a 
                        href={`/?c=${review.conversationId}`} 
                        className="text-[#1972F5] hover:underline" 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Thread
                      </a>
                    </td>
                    <td className="px-3 py-4">
                      <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-semibold capitalize", STATE_STYLES[review.state] || "bg-[#F4F4F5] text-[#5D6B98]")}>
                        {review.state.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 rounded-full bg-[#E8EAEB]">
                          <div 
                            className={cn("h-full rounded-full", review.confidence >= 75 ? "bg-[#5DAC5D]" : review.confidence >= 50 ? "bg-[#E07415]" : "bg-[#EF4444]")} 
                            style={{ width: `${review.confidence}%` }} 
                          />
                        </div>
                        <span className="text-xs text-[#5D6B98]">{review.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-xs text-[#5D6B98] uppercase mb-1">{review.reason}</div>
                      <div className="font-normal text-[#1C293B] line-clamp-2">{review.draftText || "No draft available."}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {selectedReview && (
        <div className="absolute inset-0 z-30 bg-black/5" onClick={() => setSelectedReviewId(null)} />
      )}
      {selectedReview && (
        <ReviewDetailPanel 
          review={selectedReview} 
          onClose={() => setSelectedReviewId(null)} 
          onUpdated={reloadReviews}
        />
      )}
    </div>
  );
}
