"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle, Clock, Edit2, Play, Search, Send, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AiTimelineEvent = {
  id: string;
  category: string;
  sentiment: string;
  risk: string;
  confidence: number;
  decision: string;
  reason: string;
  model: string;
  summary: string;
  channel: string;
  latencyMs: number;
  groundingSource: string;
  reviewStatus: string | null;
  error: string | null;
  createdAt: string;
};

type AiTimelineProps = {
  conversationId: string;
  onClose: () => void;
};

function getEventIcon(decision: string, reviewStatus: string | null, error: string | null) {
  if (error) return <AlertTriangle size={16} className="text-[#EF4444]" />;
  if (decision === "AUTO_SEND" || reviewStatus === "published") return <Send size={16} className="text-[#5DAC5D]" />;
  if (decision === "HUMAN_REVIEW" && reviewStatus === "pending_review") return <Clock size={16} className="text-[#E07415]" />;
  if (reviewStatus === "approved") return <CheckCircle size={16} className="text-[#1972F5]" />;
  if (reviewStatus === "rejected") return <X size={16} className="text-[#EF4444]" />;
  if (reviewStatus === "edited") return <Edit2 size={16} className="text-[#1972F5]" />;
  if (decision === "HUMAN_TAKEOVER") return <User size={16} className="text-[#5D6B98]" />;
  return <Activity size={16} className="text-[#828EA1]" />;
}

export default function AiTimeline({ conversationId, onClose }: AiTimelineProps) {
  const [events, setEvents] = useState<AiTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Resets the loading state on every conversationId change (not just
    // mount, where `loading` already starts true) — the async callbacks below
    // are guarded by `cancelled`, so this synchronous reset cannot race them.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    fetch(`/api/ai/timeline?conversationId=${conversationId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load timeline");
        return res.json();
      })
      .then((data: { timeline: AiTimelineEvent[] }) => {
        if (!cancelled) {
          setEvents(data.timeline || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error loading timeline");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  return (
    <div className="absolute inset-y-0 right-0 z-40 w-96 border-l border-[#E8EAEB] bg-white shadow-2xl flex flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-[#F4F4F5] px-6 py-4">
        <h2 className="text-base font-bold text-[#1C293B] flex items-center gap-2">
          <Activity size={18} className="text-[#1972F5]" /> AI Timeline
        </h2>
        <button onClick={onClose} className="text-[#828EA1] hover:text-[#1C293B]">
          <span className="text-xl font-light">&times;</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {error ? (
          <div className="rounded bg-[#FDE8E8] p-3 text-sm text-[#EF4444]">{error}</div>
        ) : loading ? (
          <div className="text-center text-sm text-[#828EA1]">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-sm text-[#828EA1]">No AI events for this conversation.</div>
        ) : (
          <div className="relative border-l-2 border-[#E8EAEB] ml-3 space-y-6 pb-4">
            {events.map((event, index) => (
              <div key={event.id} className="relative pl-6">
                <div className="absolute -left-[11px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E8EAEB]">
                  {getEventIcon(event.decision, event.reviewStatus, event.error)}
                </div>
                
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-[#1C293B]">
                    {event.decision.replace(/_/g, " ")}
                  </h3>
                  <span className="text-xs text-[#828EA1]">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="rounded border border-[#F4F4F5] bg-[#F8F9F9] p-3 text-xs text-[#5D6B98] mt-2 space-y-2">
                  {event.summary && <p className="text-[#1C293B] font-medium">{event.summary}</p>}
                  {event.reason && <p><span className="font-semibold">Reason:</span> {event.reason}</p>}
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8EAEB] mt-2">
                    <div><span className="font-semibold">Confidence:</span> {event.confidence}%</div>
                    <div><span className="font-semibold">Status:</span> {event.reviewStatus || "N/A"}</div>
                    <div><span className="font-semibold">Latency:</span> {event.latencyMs}ms</div>
                    <div><span className="font-semibold">Model:</span> {event.model}</div>
                  </div>
                  
                  {event.error && (
                    <div className="mt-2 text-[#EF4444] bg-[#FDE8E8] p-2 rounded border border-[#FCA5A5]">
                      <span className="font-bold">Error:</span> {event.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
