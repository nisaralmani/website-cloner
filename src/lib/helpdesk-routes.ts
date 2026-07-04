import type { LucideIcon } from "lucide-react";
import {
  Eye,
  EyeOff,
  FileEdit,
  FileText,
  FolderTree,
} from "lucide-react";
import { appHelpdeskPath } from "@/lib/marketing-paths";

export type HelpdeskNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type HelpdeskNavSection = {
  title: string;
  items: HelpdeskNavItem[];
};

export const HELPDESK_NAV: HelpdeskNavSection[] = [
  {
    title: "Knowledge Base",
    items: [
      { label: "Articles", href: appHelpdeskPath("articles"), icon: FileText },
      { label: "Categories", href: appHelpdeskPath("categories"), icon: FolderTree },
    ],
  },
  {
    title: "Status",
    items: [
      { label: "Draft", href: appHelpdeskPath("draft"), icon: FileEdit },
      { label: "Visible", href: appHelpdeskPath("visible"), icon: Eye },
      { label: "Hidden", href: appHelpdeskPath("hidden"), icon: EyeOff },
    ],
  },
];

export const HELPDESK_DEFAULT = appHelpdeskPath("articles");

export function normalizeHelpdeskPath(pathname: string): string {
  if (pathname === appHelpdeskPath() || pathname === `${appHelpdeskPath()}/`) {
    return HELPDESK_DEFAULT;
  }
  return pathname.replace(/\/$/, "");
}

export function isHelpdeskNavActive(pathname: string, href: string): boolean {
  return normalizeHelpdeskPath(pathname) === href;
}

export function helpdeskViewFromPath(
  pathname: string,
): "articles" | "categories" | "draft" | "visible" | "hidden" {
  const path = normalizeHelpdeskPath(pathname);
  if (path === appHelpdeskPath("categories")) return "categories";
  if (path === appHelpdeskPath("draft")) return "draft";
  if (path === appHelpdeskPath("visible")) return "visible";
  if (path === appHelpdeskPath("hidden")) return "hidden";
  return "articles";
}
