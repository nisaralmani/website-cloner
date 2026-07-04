"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bot,
  CircleCheck,
  FileText,
  HelpCircle,
  MessageSquare,
  Search,
  Star,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlugins } from "@/hooks/usePlugins";
import {
  appPluginsPath,
  pluginCategoryFromParams,
  pluginFilterFromParams,
} from "@/lib/plugins-routes";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "bybelt-features": MessageSquare,
  automation: Bot,
  cms: FileText,
  crm: Users,
  marketing: Star,
  messaging: MessageSquare,
  teamwork: Target,
  others: HelpCircle,
};

export default function PluginsNav() {
  const searchParams = useSearchParams();
  const filter = pluginFilterFromParams(
    searchParams.get("filter"),
    searchParams.get("installed"),
  );
  const activeCategory = pluginCategoryFromParams(searchParams.get("category"));
  const { categories } = usePlugins("all", null);

  const allActive = filter === "all" && !activeCategory;
  const installedActive = filter === "installed";

  return (
    <nav className="flex h-full w-[300px] shrink-0 flex-col overflow-y-auto border-r border-[#E6EAF0] bg-white py-4">
      <div className="flex flex-col gap-4 px-3">
        <Link
          href={appPluginsPath()}
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg px-3",
            allActive
              ? "border border-[#D2D4D8] bg-white"
              : "hover:bg-[#F4F6FB]",
          )}
        >
          <Search size={16} className="shrink-0 text-[#2C405A]" />
          <span className="truncate text-sm font-semibold text-[#1C293B]">
            All Plugins
          </span>
        </Link>

        <Link
          href={appPluginsPath({ filter: "installed" })}
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold text-[#1C293B]",
            installedActive ? "border border-[#D2D4D8] bg-white" : "hover:bg-[#F4F6FB]",
          )}
        >
          <CircleCheck size={16} className="shrink-0 text-[#2C405A]" />
          <span>Installed Plugins</span>
        </Link>

        <div>
          <p className="mb-2 px-2 text-sm font-bold text-[#1C293B]">Categories</p>
          <div className="flex flex-col gap-0.5">
            {categories.map((item) => {
              const Icon = CATEGORY_ICONS[item.id] ?? HelpCircle;
              const active = activeCategory === item.id;
              return (
                <Link
                  key={item.id}
                  href={appPluginsPath({ category: item.id })}
                  className={cn(
                    "flex h-9 items-center justify-between rounded-lg px-3 text-sm font-semibold text-[#1C293B]",
                    active ? "border border-[#D2D4D8] bg-white" : "hover:bg-[#F4F6FB]",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5 truncate">
                    <Icon size={16} className="shrink-0 text-[#2C405A]" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="ml-2 shrink-0 rounded bg-[#F4F4F5] px-1.5 py-0.5 text-[11px] font-semibold text-[#828EA1]">
                    {item.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
