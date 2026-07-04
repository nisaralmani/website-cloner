"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserRound,
  CreditCard,
  LayoutGrid,
  MessageSquare,
  Inbox,
  Mail,
  PlusCircle,
  Languages,
  HelpCircle,
  Activity,
  Gift,
  ChevronDown,
  ChevronUp,
  Bell,
  Clock,
  Shield,
  Laptop,
  Keyboard,
  Building2,
  Phone,
  Code2,
  Users,
  ScrollText,
  Wrench,
  Scale,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { settingsTree } from "@/lib/settings-data";
import { APP_SETTINGS_ROOT_PATH, appSettingsPath } from "@/lib/marketing-paths";
import { useSession } from "@/components/providers/SessionProvider";
import { PUBLIC_HELP_CENTER_URL, PUBLIC_STATUS_URL } from "@/lib/docs-links";

const ICONS: Record<string, LucideIcon> = {
  UserRound,
  CreditCard,
  LayoutGrid,
  MessageSquare,
  Inbox,
  Mail,
  PlusCircle,
  Languages,
  HelpCircle,
  Activity,
  Gift,
  ChevronDown,
  ChevronUp,
  Bell,
  Clock,
  Shield,
  Laptop,
  Keyboard,
  Building2,
  Phone,
  Code2,
  Users,
  ScrollText,
  Wrench,
  Scale,
  AlertTriangle,
};

type SettingsLink = {
  label: string;
  icon: string;
  accent?: boolean;
  href?: string;
  external?: boolean;
};

const settingsLinks: SettingsLink[] = [
  { label: "Create a new workspace", icon: "PlusCircle", accent: true },
  { label: "Help translate the chatbox", icon: "Languages" },
  {
    label: "Get help using Bybelt",
    icon: "HelpCircle",
    href: PUBLIC_HELP_CENTER_URL,
    external: true,
  },
  {
    label: "Service status",
    icon: "Activity",
    href: PUBLIC_STATUS_URL,
    external: true,
  },
  { label: "What's new?", icon: "Gift" },
];

export default function SettingsNav() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { user } = useSession();
  const showAccountAlert = user?.emailVerified === false;

  const activeCat = settingsTree.find((c) =>
    c.items.some((i) => pathname.includes(i.slug)),
  )?.label;

  const onOverview = pathname === APP_SETTINGS_ROOT_PATH;

  const toggle = (label: string) =>
    setExpanded((prev) => ({
      ...prev,
      [label]: !(prev[label] ?? label === activeCat),
    }));

  return (
    <nav className="flex h-full w-[300px] shrink-0 flex-col overflow-y-auto border-r border-[#E6EAF0] bg-white py-3">
      <div className="flex flex-col gap-0.5 px-2">
        {settingsTree.map((category) => {
          const CatIcon = ICONS[category.icon] ?? HelpCircle;
          const open = expanded[category.label] ?? category.label === activeCat;
          const categoryActive =
            !onOverview && category.items.some((i) => pathname.includes(i.slug));
          return (
            <div key={category.label}>
              <button
                type="button"
                onClick={() => toggle(category.label)}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-lg px-3 hover:bg-[#F4F6FB]",
                  categoryActive && "bg-[#F4F6FB]",
                )}
              >
                <span className="flex items-center gap-3">
                  <CatIcon size={18} className="text-[#2C405A]" />
                  <span className="text-sm font-semibold text-[#2C405A]">
                    {category.label}
                  </span>
                </span>
                {open ? (
                  <ChevronUp size={16} className="text-[#828EA1]" />
                ) : (
                  <ChevronDown size={16} className="text-[#828EA1]" />
                )}
              </button>

              {open && (
                <div className="mb-1 mt-0.5 flex flex-col gap-0.5 pl-1">
                  {category.items.map((item) => {
                    const active = pathname.includes(item.slug);
                    const ItemIcon = item.icon ? ICONS[item.icon] : null;
                    return (
                      <Link
                        key={item.slug}
                        href={appSettingsPath(item.slug)}
                        className={cn(
                          "flex h-9 items-center justify-between rounded-lg px-3 text-sm",
                          active
                            ? "border border-[#D2D4D8] bg-white font-normal text-[#1c293b]"
                            : "text-[#5D6B98] hover:bg-[#F4F6FB]",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2.5 truncate pl-4">
                          {ItemIcon && (
                            <ItemIcon
                              size={15}
                              className={cn(
                                "shrink-0",
                                active ? "text-[#2C405A]" : "text-[#828EA1]",
                              )}
                            />
                          )}
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.slug === "account/information" && showAccountAlert && (
                          <span className="ml-2 shrink-0 rounded bg-[#F97316] px-1.5 py-0.5 text-[11px] font-semibold capitalize text-white">
                            1 alert
                          </span>
                        )}
                        {item.badge && (
                          <span className="ml-2 shrink-0 rounded bg-[#F97316] px-1.5 py-0.5 text-[11px] font-semibold capitalize text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-2 my-3 border-t border-[#E6EAF0]" />

      <div className="flex flex-col gap-0.5 px-2">
        {settingsLinks.map((link) => {
          const Icon = ICONS[link.icon] ?? HelpCircle;
          const content = (
            <>
              <Icon
                size={16}
                className={link.accent ? "text-[#1972F5]" : "text-[#828EA1]"}
              />
              <span
                className={cn(
                  link.accent
                    ? "font-semibold text-[#1972F5]"
                    : "text-[#5D6B98]",
                )}
              >
                {link.label}
              </span>
            </>
          );
          if (link.href) {
            return link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm hover:bg-[#F4F6FB]"
              >
                {content}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm hover:bg-[#F4F6FB]"
              >
                {content}
              </Link>
            );
          }
          return (
            <button
              key={link.label}
              type="button"
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm hover:bg-[#F4F6FB]"
            >
              {content}
            </button>
          );
        })}
      </div>

    </nav>
  );
}
