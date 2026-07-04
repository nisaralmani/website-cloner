import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bot,
  Clock,
  FileText,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Star,
  Target,
  Timer,
  User,
  Users,
  Zap,
} from "lucide-react";

import { APP_ANALYTICS_PATH, appAnalyticsPath } from "@/lib/marketing-paths";

export type AnalyticsNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  action?: boolean;
};

export type AnalyticsNavSection = {
  title: string;
  items: AnalyticsNavItem[];
};

export const ANALYTICS_NAV: AnalyticsNavSection[] = [
  {
    title: "Dashboards",
    items: [
      {
        label: "Default Dashboard",
        href: appAnalyticsPath("dashboard/default"),
        icon: LayoutDashboard,
      },
      {
        label: "Create new dashboard",
        href: appAnalyticsPath("dashboard/new"),
        icon: Plus,
        action: true,
      },
    ],
  },
  {
    title: "AI Performance",
    items: [
      {
        label: "AI Overview",
        href: appAnalyticsPath("ai/overview"),
        icon: Bot,
      },
      {
        label: "Review Queue Analytics",
        href: appAnalyticsPath("ai/reviews"),
        icon: Activity,
      },
    ],
  },
  {
    title: "Messaging",
    items: [
      {
        label: "Overview",
        href: appAnalyticsPath("messaging/overview"),
        icon: BarChart3,
      },
      { label: "Workload", href: appAnalyticsPath("messaging/workload"), icon: Activity },
      {
        label: "Responsiveness",
        href: appAnalyticsPath("messaging/responsiveness"),
        icon: Timer,
      },
      { label: "Ratings", href: appAnalyticsPath("messaging/ratings"), icon: Star },
      { label: "Operators", href: appAnalyticsPath("messaging/operators"), icon: User },
      {
        label: "Automations",
        href: appAnalyticsPath("messaging/automations"),
        icon: Bot,
      },
      { label: "Channels", href: appAnalyticsPath("messaging/channels"), icon: MessageSquare },
      { label: "SLAs", href: appAnalyticsPath("messaging/sla"), icon: Clock },
      { label: "Segments", href: appAnalyticsPath("messaging/segments"), icon: Target },
      { label: "Shortcuts", href: appAnalyticsPath("messaging/shortcuts"), icon: Zap },
    ],
  },
  {
    title: "Visitors",
    items: [
      {
        label: "Website Visits",
        href: appAnalyticsPath("visitors/website-visits"),
        icon: Globe,
      },
      { label: "Triggers", href: appAnalyticsPath("visitors/triggers"), icon: Zap },
    ],
  },
  {
    title: "Knowledge Base",
    items: [
      {
        label: "Knowledge Base Visits",
        href: appAnalyticsPath("helpdesk/visits"),
        icon: FileText,
      },
      { label: "Search", href: appAnalyticsPath("helpdesk/search"), icon: Search },
      { label: "Articles", href: appAnalyticsPath("helpdesk/articles"), icon: FileText },
    ],
  },
  {
    title: "Contacts",
    items: [
      {
        label: "Contacts Saved",
        href: appAnalyticsPath("contacts/contacts-saved"),
        icon: Users,
      },
      {
        label: "Campaigns Reached",
        href: appAnalyticsPath("contacts/campaigns-reach"),
        icon: Target,
      },
      {
        label: "Campaigns Activity",
        href: appAnalyticsPath("contacts/campaigns-activity"),
        icon: Activity,
      },
    ],
  },
  {
    title: "Status Page",
    items: [
      { label: "Downtimes", href: appAnalyticsPath("status/downtimes"), icon: Clock },
    ],
  },
];

export const ANALYTICS_DEFAULT = appAnalyticsPath("messaging/overview");

export type AnalyticsViewKind =
  | "overview"
  | "ratings"
  | "workload"
  | "operators"
  | "responsiveness"
  | "website-visits"
  | "dashboard-new"
  | "automations"
  | "channels"
  | "sla"
  | "segments"
  | "shortcuts"
  | "triggers"
  | "helpdesk-visits"
  | "helpdesk-search"
  | "helpdesk-articles"
  | "contacts-saved"
  | "campaigns-reach"
  | "campaigns-activity"
  | "status-downtimes"
  | "ai-overview"
  | "ai-reviews"
  | "generic";

const ANALYTICS_VIEW_BY_PATH: Record<string, AnalyticsViewKind> = {
  [appAnalyticsPath("messaging/overview")]: "overview",
  [appAnalyticsPath("dashboard/default")]: "overview",
  [appAnalyticsPath("messaging/ratings")]: "ratings",
  [appAnalyticsPath("messaging/workload")]: "workload",
  [appAnalyticsPath("messaging/operators")]: "operators",
  [appAnalyticsPath("messaging/responsiveness")]: "responsiveness",
  [appAnalyticsPath("messaging/automations")]: "automations",
  [appAnalyticsPath("messaging/channels")]: "channels",
  [appAnalyticsPath("messaging/sla")]: "sla",
  [appAnalyticsPath("messaging/segments")]: "segments",
  [appAnalyticsPath("messaging/shortcuts")]: "shortcuts",
  [appAnalyticsPath("visitors/website-visits")]: "website-visits",
  [appAnalyticsPath("visitors/triggers")]: "triggers",
  [appAnalyticsPath("helpdesk/visits")]: "helpdesk-visits",
  [appAnalyticsPath("helpdesk/search")]: "helpdesk-search",
  [appAnalyticsPath("helpdesk/articles")]: "helpdesk-articles",
  [appAnalyticsPath("contacts/contacts-saved")]: "contacts-saved",
  [appAnalyticsPath("contacts/campaigns-reach")]: "campaigns-reach",
  [appAnalyticsPath("contacts/campaigns-activity")]: "campaigns-activity",
  [appAnalyticsPath("status/downtimes")]: "status-downtimes",
  [appAnalyticsPath("dashboard/new")]: "dashboard-new",
  [appAnalyticsPath("ai/overview")]: "ai-overview",
  [appAnalyticsPath("ai/reviews")]: "ai-reviews",
};

export function analyticsViewKind(pathname: string): AnalyticsViewKind {
  return ANALYTICS_VIEW_BY_PATH[normalizeAnalyticsPath(pathname)] ?? "generic";
}

export function normalizeAnalyticsPath(pathname: string): string {
  if (pathname === APP_ANALYTICS_PATH || pathname === `${APP_ANALYTICS_PATH}/`) {
    return ANALYTICS_DEFAULT;
  }
  return pathname.replace(/\/$/, "");
}

export function isAnalyticsNavActive(pathname: string, href: string): boolean {
  return normalizeAnalyticsPath(pathname) === href;
}

export function getAnalyticsNavLabel(pathname: string): string {
  const normalized = normalizeAnalyticsPath(pathname);
  for (const section of ANALYTICS_NAV) {
    const match = section.items.find((item) => item.href === normalized);
    if (match) return match.label;
  }
  return "Overview";
}

export function analyticsViewFromPath(pathname: string): string {
  return normalizeAnalyticsPath(pathname).replace(`${APP_ANALYTICS_PATH}/`, "");
}
