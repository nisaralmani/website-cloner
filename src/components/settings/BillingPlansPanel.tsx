"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import type { WorkspacePlan } from "@/types/billing";

const PLAN_OPTIONS = ["Mini", "Essentials", "Plus"] as const;

type BillingPlansPanelProps = {
  plans: WorkspacePlan[];
  onPlanChanged?: () => void | Promise<void>;
};

export function BillingPlansPanel({ plans, onPlanChanged }: BillingPlansPanelProps) {
  const [changingId, setChangingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChangePlan = async (plan: WorkspacePlan) => {
    const planTag = window
      .prompt(
        `Change plan for ${plan.name} (current: ${plan.planTag}). Enter: ${PLAN_OPTIONS.join(", ")}`,
        plan.planTag,
      )
      ?.trim();

    if (!planTag || planTag === plan.planTag) return;
    if (!PLAN_OPTIONS.includes(planTag as (typeof PLAN_OPTIONS)[number])) {
      setError("Invalid plan. Choose Mini, Essentials, or Plus.");
      return;
    }

    setChangingId(plan.workspaceId);
    setError(null);
    try {
      const response = await fetch("/api/billing/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: plan.workspaceId,
          planTag,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to change plan");
      }
      await onPlanChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change plan.");
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
      {plans.map((plan) => (
        <div key={plan.workspaceId}>
          <div className="mb-6 flex items-center gap-3">
            <img
              src={plan.avatarUrl ?? "/images/avatars/workspace-fashionsis.jpg"}
              alt=""
              className="h-[30px] w-[30px] rounded-full object-cover"
            />
            <span className="text-lg font-bold text-[#1c293b]">{plan.name}</span>
            <span className="rounded bg-[#0093ee] px-2 py-1 text-xs font-bold text-white">
              {plan.planTag}
            </span>
          </div>
          <div className="mb-4 flex rounded-lg border border-[#E8EAEB] bg-white p-6">
            <div className="min-w-0 flex-1">
              <p className="text-[40px] font-semibold leading-[44px] text-[#2c405a]">
                {plan.amount}
              </p>
              <p className="text-xs font-semibold text-[#8d949d]">{plan.period}</p>
            </div>
            <div className="flex min-w-0 flex-col items-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF6ED] px-[5px] py-[2px] text-[12.5px] font-bold text-[#39A746]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39A746]" />
                {plan.status}
              </span>
              <div className="mt-[21px] flex items-center gap-1 text-sm text-[#8d949d]">
                <UserRound size={20} className="shrink-0" strokeWidth={1.75} />
                <span>Billing owner</span>
                <span className="truncate">{plan.billingOwner}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={changingId === plan.workspaceId}
            onClick={() => void handleChangePlan(plan)}
            className="inline-flex h-[36px] items-center rounded border border-black/10 bg-[#1972F5] px-4 text-[13px] font-bold text-white disabled:opacity-60"
          >
            {changingId === plan.workspaceId ? "Changing…" : "Change Plan"}
          </button>
        </div>
      ))}
    </div>
  );
}
