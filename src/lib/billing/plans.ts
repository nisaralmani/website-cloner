import type { WorkspacePlan } from "@/types/billing";

export const DEFAULT_FREE_PLAN = {
  planTag: "Free",
  planAmount: "Free",
  planPeriod: "forever!",
  status: "Active",
  billingOwner: "none",
  monthlyCents: 0,
} as const;

export function formatMonthlyTotal(cents: number) {
  const dollars = Math.floor(cents / 100);
  const remainder = Math.abs(cents % 100);
  return {
    currency: "$",
    amount: String(dollars),
    cents: `.${String(remainder).padStart(2, "0")}`,
  };
}

export function workspaceAvatarUrl(name: string, logoUrl: string | null) {
  if (logoUrl) {
    return logoUrl;
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  if (slug) {
    return `/images/avatars/workspace-${slug}.jpg`;
  }

  return "/images/avatars/workspace-fashionsis.jpg";
}

type SubscriptionRow = {
  workspaceId: string;
  planTag: string;
  planAmount: string;
  planPeriod: string;
  status: string;
  billingOwner: string;
  monthlyCents: number;
};

type WorkspaceRow = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export function toWorkspacePlan(
  workspace: WorkspaceRow,
  subscription: SubscriptionRow,
): WorkspacePlan {
  return {
    workspaceId: workspace.id,
    name: workspace.name,
    avatarUrl: workspaceAvatarUrl(workspace.name, workspace.logoUrl),
    planTag: subscription.planTag,
    amount: subscription.planAmount,
    period: subscription.planPeriod,
    status: subscription.status,
    billingOwner: subscription.billingOwner,
  };
}
