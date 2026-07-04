import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Mail,
  Search,
  Tag,
  Target,
} from "lucide-react";
import { APP_CAMPAIGNS_PATH, appCampaignsPath } from "@/lib/marketing-paths";

export type CampaignsNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: keyof import("@/types/campaigns").CampaignCounts;
};

export type CampaignsNavSection = {
  title: string;
  items: CampaignsNavItem[];
};

export const CAMPAIGNS_NAV: CampaignsNavSection[] = [
  {
    title: "Types",
    items: [
      { label: "All Types", href: appCampaignsPath("types/all"), icon: Search },
      { label: "Automated", href: appCampaignsPath("types/automated"), icon: Mail },
      { label: "One-Shot", href: appCampaignsPath("types/one-shot"), icon: Target },
    ],
  },
  {
    title: "Tags",
    items: [{ label: "All Tags", href: appCampaignsPath("tags/all"), icon: Tag }],
  },
  {
    title: "Templates",
    items: [
      {
        label: "All Templates",
        href: appCampaignsPath("templates/all"),
        icon: FileText,
        badgeKey: "templatesAll",
      },
      {
        label: "Bybelt Templates",
        href: appCampaignsPath("templates/bybelt"),
        icon: FileText,
        badgeKey: "templatesBybelt",
      },
      {
        label: "Your Templates",
        href: appCampaignsPath("templates/yours"),
        icon: FileText,
        badgeKey: "templatesYours",
      },
    ],
  },
];

export const CAMPAIGNS_DEFAULT = appCampaignsPath("types/all");

export function normalizeCampaignsPath(pathname: string): string {
  if (pathname === APP_CAMPAIGNS_PATH || pathname === `${APP_CAMPAIGNS_PATH}/`) {
    return CAMPAIGNS_DEFAULT;
  }
  return pathname.replace(/\/$/, "");
}

export function isCampaignsNavActive(pathname: string, href: string): boolean {
  return normalizeCampaignsPath(pathname) === href;
}

export function campaignsTypeFromPath(pathname: string): "all" | "automated" | "one-shot" {
  const path = normalizeCampaignsPath(pathname);
  if (path === appCampaignsPath("types/automated")) return "automated";
  if (path === appCampaignsPath("types/one-shot")) return "one-shot";
  return "all";
}

export function isCampaignsTemplatesPath(pathname: string): boolean {
  return normalizeCampaignsPath(pathname).startsWith(appCampaignsPath("templates"));
}

export function isCampaignsTagsPath(pathname: string): boolean {
  return normalizeCampaignsPath(pathname).startsWith(appCampaignsPath("tags"));
}

export function campaignsTemplateCategoryFromPath(
  pathname: string,
): "all" | "bybelt" | "yours" {
  const path = normalizeCampaignsPath(pathname);
  if (path === appCampaignsPath("templates/bybelt")) return "bybelt";
  if (path === appCampaignsPath("templates/yours")) return "yours";
  return "all";
}
