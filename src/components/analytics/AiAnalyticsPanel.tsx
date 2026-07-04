"use client";

import { Activity, CheckCircle, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
};

function StatCard({ title, value, trend, trendUp, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-[#E6EAF0] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F6FB] text-[#1972F5]">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#5D6B98]">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1C293B]">{value}</span>
            {trend && (
              <span className={cn("text-xs font-semibold", trendUp ? "text-[#5DAC5D]" : "text-[#EF4444]")}>
                {trendUp ? "↑" : "↓"} {trend}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";

type AiAgentMetrics = {
  total: number;
  autoReplied: number;
  drafted: number;
  escalated: number;
  spam: number;
  ignored: number;
  notesOnly: number;
  autoResolutionRate: number;
  escalationRate: number;
  spamRate: number;
  avgConfidence: number;
};

export default function AiAnalyticsPanel() {
  const [metrics, setMetrics] = useState<AiAgentMetrics | null>(null);

  useEffect(() => {
    fetch("/api/analytics/ai-agent?days=30")
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(() => {});
  }, []);

  const total = metrics?.total ?? 1432;
  const autoReplied = metrics?.autoReplied ?? 1145;
  const drafted = metrics?.drafted ?? 287;
  const autoResolutionRate = metrics?.autoResolutionRate ?? 80;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total AI Responses"
          value={total.toLocaleString()}
          trend="1m 30s"
          trendUp={true} // Lower is better
          icon={<CheckCircle size={24} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-[#E6EAF0] bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1C293B] mb-4">Automation Rate</h3>
          <div className="flex items-center justify-center h-48 bg-[#F8F9F9] rounded border border-dashed border-[#E6EAF0]">
            <span className="text-[#828EA1] text-sm font-medium">Line Chart Visualization</span>
          </div>
          <div className="mt-4 text-sm text-[#5D6B98]">
            The AI successfully handled <strong className="text-[#1C293B]">{autoResolutionRate}%</strong> of conversations without human intervention.
          </div>
        </div>

        <div className="rounded-lg border border-[#E6EAF0] bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1C293B] mb-4">Review Outcomes</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-[#1C293B]">Approved (Unedited)</span>
                <span className="text-[#5D6B98]">65%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F4F6FB] overflow-hidden">
                <div className="h-full bg-[#5DAC5D]" style={{ width: "65%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-[#1C293B]">Edited & Published</span>
                <span className="text-[#5D6B98]">25%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F4F6FB] overflow-hidden">
                <div className="h-full bg-[#1972F5]" style={{ width: "25%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-[#1C293B]">Rejected</span>
                <span className="text-[#5D6B98]">10%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F4F6FB] overflow-hidden">
                <div className="h-full bg-[#EF4444]" style={{ width: "10%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
