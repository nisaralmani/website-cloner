"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CAMPAIGNS_NAV,
  isCampaignsNavActive,
} from "@/lib/campaigns-routes";
import { useCampaignCounts } from "@/hooks/useCampaigns";

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  active,
}: {
  href: string;
  label: string;
  icon: (typeof CAMPAIGNS_NAV)[0]["items"][0]["icon"];
  badge?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-9 items-center justify-between rounded-lg px-3 text-sm font-semibold",
        active
          ? "border border-[#D2D4D8] bg-white text-[#1C293B]"
          : "text-[#1C293B] hover:bg-[#F4F6FB]",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5 truncate">
        <Icon size={16} className="shrink-0 text-[#2C405A]" />
        <span className="truncate">{label}</span>
      </span>
      {badge && (
        <span className="ml-2 shrink-0 rounded bg-[#F4F4F5] px-1.5 py-0.5 text-[11px] font-semibold text-[#828EA1]">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function CampaignsNav() {
  const pathname = usePathname();
  const counts = useCampaignCounts();

  return (
    <nav className="flex h-full w-[300px] shrink-0 flex-col overflow-y-auto border-r border-[#E6EAF0] bg-white py-4">
      <div className="flex flex-col gap-4 px-3">
        {CAMPAIGNS_NAV.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-2 text-sm font-bold text-[#1C293B]">
              {section.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const badgeValue = item.badgeKey ? counts[item.badgeKey] : 0;
                return (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    badge={badgeValue > 0 ? String(badgeValue) : undefined}
                    active={isCampaignsNavActive(pathname, item.href)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
