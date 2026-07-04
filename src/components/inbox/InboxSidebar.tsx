"use client";

import {
  Gauge,
  Gift,
  Inbox,
  HelpCircle,
  Search,
  LayoutGrid,
  Settings,
  Sparkles,
  Globe,
  Users,
  Megaphone,
  BookOpen,
  BarChart3,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useContactFilterContext } from "@/components/contacts/ContactFilterContext";
import { PUBLIC_HELP_CENTER_URL, DOCS_INBOX_URL } from "@/lib/docs-links";
import {
  APP_AGENT_PATH,
  APP_ANALYTICS_PATH,
  APP_CAMPAIGNS_PATH,
  APP_CONTACTS_PATH,
  appContactsPath,
  APP_HELPDESK_PATH,
  APP_INBOX_PATH,
  APP_PLUGINS_PATH,
  APP_SETTINGS_ROOT_PATH,
  APP_VISITORS_PATH,
} from "@/lib/marketing-paths";
import { useVisitorCount } from "@/hooks/useVisitors";
import { useInboxCounts } from "@/hooks/useInboxCounts";
import { useSearch } from "@/components/search/SearchProvider";
import { useSession } from "@/components/providers/SessionProvider";
import type { SessionWorkspace } from "@/types/session";
import type { SubInbox } from "@/types/sub-inboxes";
import { UserAccountMenu } from "@/components/inbox/UserAccountMenu";
import { WorkspaceSwitcher } from "@/components/inbox/WorkspaceSwitcher";

const HELP_URL = PUBLIC_HELP_CENTER_URL;

const PRIMARY_NAV: {
  label: string;
  Icon: typeof Sparkles;
  href?: string;
  badge?: number;
  activeStyle?: "agent" | "bordered";
}[] = [
  { label: "AI Agent", Icon: Sparkles, href: APP_AGENT_PATH, activeStyle: "agent" },
  {
    label: "Visitors",
    Icon: Globe,
    href: APP_VISITORS_PATH,
    activeStyle: "bordered",
  },
  { label: "Contacts", Icon: Users, href: APP_CONTACTS_PATH, activeStyle: "bordered" },
  { label: "Campaigns", Icon: Megaphone, href: APP_CAMPAIGNS_PATH, activeStyle: "bordered" },
  { label: "Knowledge Base", Icon: BookOpen, href: APP_HELPDESK_PATH, activeStyle: "bordered" },
  { label: "Analytics", Icon: BarChart3, href: APP_ANALYTICS_PATH, activeStyle: "bordered" },
];

function primaryNavActiveClass(
  active: boolean,
  activeStyle?: "agent" | "bordered",
) {
  if (!active) {
    return "text-[#2C405A] hover:bg-[#F4F6FB]";
  }
  if (activeStyle === "agent") {
    return "bg-[radial-gradient(100%_100%_at_50%_50%,#707070_10%,#1C1C1C_100%)] text-[#0093EE]";
  }
  return "border border-[#D2D4D8] text-[#0093EE] shadow-[inset_0_-2px_0_rgba(0,0,0,0.06)]";
}

const SECONDARY_NAV: {
  label: string;
  Icon: typeof HelpCircle;
  accent?: boolean;
  href?: string;
  external?: boolean;
  action?: "search";
}[] = [
  { label: "Get help", Icon: HelpCircle, accent: true, href: HELP_URL, external: true },
  { label: "Developer docs", Icon: BookOpen, href: DOCS_INBOX_URL, external: true },
  { label: "Search", Icon: Search, action: "search" },
  { label: "Plugins", Icon: LayoutGrid, href: APP_PLUGINS_PATH },
  { label: "Settings", Icon: Settings, href: APP_SETTINGS_ROOT_PATH },
];

function CountBadge({
  count,
  className,
}: {
  count: number | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none text-white",
        className,
      )}
    >
      {count}
    </span>
  );
}

export type InboxListFilter =
  | { type: "main" }
  | { type: "spam" }
  | { type: "shopify" }
  | { type: "getStarted" }
  | { type: "subInbox"; id: string };

type InboxSidebarProps = {
  inboxFilter?: InboxListFilter;
  onInboxFilterChange?: (filter: InboxListFilter) => void;
  subInboxes?: SubInbox[];
  subInboxUnread?: Record<string, number>;
  creatingSubInbox?: boolean;
  onCreateSubInbox?: () => void;
  upgrading?: boolean;
  onUpgrade?: () => void;
  shopifyLinked?: boolean;
};

export default function InboxSidebar({
  inboxFilter = { type: "main" },
  onInboxFilterChange = () => {},
  subInboxes = [],
  subInboxUnread = {},
  creatingSubInbox = false,
  onCreateSubInbox,
  upgrading = false,
  onUpgrade,
  shopifyLinked = false,
}: InboxSidebarProps = {}) {
  const pathname = usePathname();
  const visitorCount = useVisitorCount();
  const { counts: inboxCounts } = useInboxCounts();
  const { user: sessionUser, workspace: sessionWorkspace, loading: sessionLoading } = useSession();
  const workspace: SessionWorkspace | null = sessionWorkspace;
  const currentUser = sessionUser;
  const onInbox = pathname === APP_INBOX_PATH;
  const onSettings = pathname.startsWith(APP_SETTINGS_ROOT_PATH);
  const onAgent = pathname.startsWith(APP_AGENT_PATH);
  const onVisitors = pathname.startsWith(APP_VISITORS_PATH);
  const onContacts = pathname.startsWith(APP_CONTACTS_PATH);
  const onCampaigns = pathname.startsWith(APP_CAMPAIGNS_PATH);
  const onHelpdesk = pathname.startsWith(APP_HELPDESK_PATH);
  const onAnalytics = pathname.startsWith(APP_ANALYTICS_PATH);
  const onPlugins = pathname.startsWith(APP_PLUGINS_PATH);
  const { openSearch } = useSearch();
  const router = useRouter();
  const contactFilters = useContactFilterContext();

  return (
    <div className="flex h-full w-[200px] shrink-0 flex-col border-r border-[#E6EAF0] bg-white px-2">
      {/* Workspace header */}
      {workspace ? (
        <WorkspaceSwitcher
          workspace={workspace}
          notificationCount={inboxCounts.notificationCount}
        />
      ) : (
        <div className="flex h-[60px] items-center px-2.5 text-sm font-semibold text-[#828EA1]">
          {sessionLoading ? "Loading workspace..." : "Workspace unavailable"}
        </div>
      )}

      <button
        type="button"
        disabled={upgrading}
        onClick={() => onUpgrade?.()}
        className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#F97316] px-3 text-sm font-bold text-white disabled:opacity-60"
      >
        <Gauge size={18} strokeWidth={2} />
        {upgrading ? "Upgrading…" : "Upgrade"}
      </button>

      <button
        type="button"
        onClick={() => onInboxFilterChange({ type: "getStarted" })}
        className={cn(
          "mt-2 flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#40B630] px-3 text-sm font-bold text-white",
          inboxFilter.type === "getStarted" && "ring-2 ring-[#1972F5] ring-offset-1",
        )}
      >
        <Gift size={18} strokeWidth={2} />
        <span className="truncate">Get Started</span>
        <CountBadge count={inboxCounts.getStarted} className="bg-[#E11900]" />
      </button>

      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Inbox block */}
        <div className={cn("rounded-lg", onInbox && "bg-[#F4F6FB]")}>
          <Link
            href={APP_INBOX_PATH}
            className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 hover:bg-[#F4F6FB]"
          >
            <Inbox size={18} className="shrink-0 text-[#1C293B]" strokeWidth={1.75} />
            <span className="truncate text-sm font-semibold text-[#1C293B]">Inbox</span>
          </Link>

          <p className="px-2.5 pb-1 pt-1 text-[11px] font-semibold text-[#828EA1]">
            Default Inboxes
          </p>
          <button
            type="button"
            onClick={() => onInboxFilterChange({ type: "main" })}
            className={cn(
              "mx-1 flex h-9 w-[calc(100%-8px)] items-center gap-2 rounded-lg pl-6 pr-2 text-sm font-semibold text-[#1C293B]",
              inboxFilter.type === "main" ? "bg-white" : "hover:bg-white/80",
            )}
          >
            <span className="text-base leading-none" aria-hidden>
              💬
            </span>
            <span className="truncate">Main Inbox</span>
            <CountBadge count={inboxCounts.mainInbox} className="bg-[#E11900]" />
          </button>

          <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold text-[#828EA1]">
            Your Inboxes
          </p>
          {subInboxes.map((subInbox) => (
            <button
              key={subInbox.id}
              type="button"
              onClick={() => onInboxFilterChange({ type: "subInbox", id: subInbox.id })}
              className={cn(
                "mx-1 flex h-9 w-[calc(100%-8px)] items-center gap-2 rounded-lg pl-6 pr-2 text-sm font-semibold text-[#1C293B]",
                inboxFilter.type === "subInbox" && inboxFilter.id === subInbox.id
                  ? "bg-white"
                  : "hover:bg-white/80",
              )}
            >
              <span className="truncate">{subInbox.name}</span>
              {(subInboxUnread[subInbox.id] ?? 0) > 0 ? (
                <CountBadge
                  count={subInboxUnread[subInbox.id] ?? 0}
                  className="bg-[#E11900]"
                />
              ) : null}
            </button>
          ))}
          <button
            type="button"
            disabled={creatingSubInbox}
            onClick={() => onCreateSubInbox?.()}
            className="mx-1 flex h-9 w-[calc(100%-8px)] items-center gap-2 rounded-lg pl-6 pr-2 text-sm font-semibold text-[#5D6B98] hover:bg-white/80 disabled:opacity-60"
          >
            <Plus size={14} strokeWidth={2.5} />
            {creatingSubInbox ? "Creating…" : "New sub-inbox"}
          </button>

          <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold text-[#828EA1]">
            Other Inboxes
          </p>
          <button
            type="button"
            onClick={() => onInboxFilterChange({ type: "spam" })}
            className={cn(
              "mx-1 flex h-9 w-[calc(100%-8px)] items-center gap-2 rounded-lg pl-6 pr-2 text-sm font-semibold text-[#5D6B98] hover:bg-white/80",
              inboxFilter.type === "spam" && "bg-white text-[#1C293B]",
            )}
          >
            <span className="text-base leading-none" aria-hidden>
              💣
            </span>
            <span className="truncate">Spam</span>
            {inboxCounts.spam > 0 ? (
              <CountBadge count={inboxCounts.spam} className="bg-[#E11900]" />
            ) : null}
          </button>
          {shopifyLinked ? (
            <button
              type="button"
              onClick={() => onInboxFilterChange({ type: "shopify" })}
              className={cn(
                "mx-1 mb-1 flex h-9 w-[calc(100%-8px)] items-center gap-2 rounded-lg pl-6 pr-2 text-sm font-semibold text-[#5D6B98] hover:bg-white/80",
                inboxFilter.type === "shopify" && "bg-white text-[#1C293B]",
              )}
            >
              <span className="text-base leading-none" aria-hidden>
                🛒
              </span>
              <span className="truncate">Shopify</span>
              {inboxCounts.shopify > 0 ? (
                <CountBadge count={inboxCounts.shopify} className="bg-[#5DAC5D]" />
              ) : null}
            </button>
          ) : null}
        </div>

        <nav className="mt-2 shrink-0">
          {PRIMARY_NAV.map(({ label, Icon, href, activeStyle }) => {
            const active =
              href !== undefined &&
              (href === APP_AGENT_PATH
                ? onAgent
                : href === APP_VISITORS_PATH
                  ? onVisitors
                  : href === APP_CONTACTS_PATH
                    ? onContacts
                    : href === APP_CAMPAIGNS_PATH
                      ? onCampaigns
                      : href === APP_HELPDESK_PATH
                        ? onHelpdesk
                        : href === APP_ANALYTICS_PATH
                          ? onAnalytics
                          : pathname.startsWith(href));
            const className = cn(
              "flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-semibold",
              primaryNavActiveClass(active, activeStyle),
            );
            const icon = (
              <Icon
                size={18}
                strokeWidth={1.75}
                className={active ? "text-[#0093EE]" : "text-[#2C405A]"}
              />
            );
            const content = (
              <>
                {icon}
                <span className="truncate">{label}</span>
                {label === "Visitors" && visitorCount > 0 && !active && (
                  <CountBadge count={visitorCount} className="ml-auto bg-[#0093EE]" />
                )}
              </>
            );
            return (
              <div key={label}>
                {href !== undefined ? (
                  <Link href={href} className={className}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" className={className}>
                    {content}
                  </button>
                )}
                {label === "Contacts" && onContacts && (
                  <div className="pb-1 pt-1">
                    <p className="px-2.5 pb-1 text-[11px] font-semibold text-[#828EA1]">
                      Filters
                    </p>
                    {contactFilters?.filters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => {
                          const params = new URLSearchParams();
                          if (filter.segment) params.set("segment", filter.segment);
                          if (filter.query) params.set("q", filter.query);
                          router.push(
                            appContactsPath({
                              segment: filter.segment,
                              q: filter.query,
                            }),
                          );
                        }}
                        className="mx-1 flex h-9 w-[calc(100%-8px)] items-center truncate rounded-lg pl-6 pr-2 text-sm font-semibold text-[#5D6B98] hover:bg-[#F4F6FB]"
                      >
                        {filter.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => contactFilters?.openCreateModal()}
                      className="mx-1 flex h-9 w-[calc(100%-8px)] items-center gap-2 rounded-lg pl-6 pr-2 text-sm font-semibold text-[#5D6B98] hover:bg-[#F4F6FB]"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      Create filter
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <nav className="mt-1 shrink-0 pb-2">
          {SECONDARY_NAV.map(({ label, Icon, accent, href, external, action }) => {
            const active =
              href === APP_SETTINGS_ROOT_PATH
                ? onSettings
                : href === APP_PLUGINS_PATH
                  ? onPlugins
                  : false;
            const className = cn(
              "flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-semibold hover:bg-[#F4F6FB]",
              active && "bg-[#F4F6FB]",
              accent ? "text-[#0093EE]" : "text-[#2C405A]",
            );
            const icon = (
              <Icon
                size={18}
                strokeWidth={1.75}
                className={accent ? "text-[#0093EE]" : "text-[#2C405A]"}
              />
            );

            if (action === "search") {
              return (
                <button
                  key={label}
                  type="button"
                  onClick={openSearch}
                  className={className}
                >
                  {icon}
                  <span className="truncate">{label}</span>
                </button>
              );
            }

            return href !== undefined ? (
              external ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {icon}
                  <span className="truncate">{label}</span>
                </a>
              ) : (
                <Link key={label} href={href} className={className}>
                  {icon}
                  <span className="truncate">{label}</span>
                </Link>
              )
            ) : (
              <button key={label} type="button" className={className}>
                {icon}
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile footer */}
      {currentUser ? (
        <UserAccountMenu key={pathname} user={currentUser} />
      ) : (
        <div className="px-2 py-2.5 text-sm text-[#828EA1]">
          {sessionLoading ? "Loading user..." : "User unavailable"}
        </div>
      )}
    </div>
  );
}

export { InboxSidebar };
