"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HELPDESK_NAV,
  isHelpdeskNavActive,
} from "@/lib/helpdesk-routes";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: (typeof HELPDESK_NAV)[0]["items"][0]["icon"];
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold text-[#1C293B]",
        active ? "border border-[#D2D4D8] bg-white" : "hover:bg-[#F4F6FB]",
      )}
    >
      <Icon size={16} className="shrink-0 text-[#2C405A]" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function HelpdeskNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-[300px] shrink-0 flex-col overflow-y-auto border-r border-[#E6EAF0] bg-white py-4">
      <div className="flex flex-col gap-4 px-3">
        {HELPDESK_NAV.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-2 text-sm font-bold text-[#1C293B]">
              {section.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  active={isHelpdeskNavActive(pathname, item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
