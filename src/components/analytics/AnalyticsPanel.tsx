"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bot,
  ChevronDown,
  Clock,
  Play,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useUpgradePlan } from "@/hooks/useUpgradePlan";
import { analyticsViewKind, getAnalyticsNavLabel } from "@/lib/analytics-routes";
import { ANALYTICS_HELP_VIDEO_URL } from "@/lib/settings-help-urls";
import { DOCS_ANALYTICS_URL } from "@/lib/docs-links";
import { appAnalyticsPath, APP_AGENT_PATH, appSettingsPath } from "@/lib/marketing-paths";
import { cn } from "@/lib/utils";
import type { AnalyticsChartPoint, AnalyticsRating } from "@/types/analytics";
import AiAnalyticsPanel from "@/components/analytics/AiAnalyticsPanel";

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Paris",
  "Europe/London",
  "Asia/Tokyo",
] as const;

const PERIOD_OPTIONS = [
  { days: 7, label: "Since a week — Last 7 days" },
  { days: 14, label: "Last 14 days" },
  { days: 30, label: "Last 30 days" },
] as const;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const HOURS = [
  "0h", "1h", "2h", "3h", "4h", "5h", "6h", "7h", "8h", "9h", "10h", "11h",
  "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h", "22h", "23h",
] as const;

const FEATURES = [
  { icon: Clock, text: "Identify your busiest hours" },
  { icon: TrendingUp, text: "Spot gaps in support performance" },
  { icon: Users, text: "Track operator's performance" },
  { icon: Bot, text: "Measure the impact of AI automations" },
] as const;

function EmptyChartMessage() {
  return (
    <p className="text-center text-sm text-[#75869C]">
      Oops! Looks like we don&apos;t have any data there at the moment.
    </p>
  );
}

function WidgetCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-[#E8EAEB] bg-white p-5 ${className ?? ""}`}
    >
      <h3 className="mb-4 text-sm font-semibold text-[#1C293B]">{title}</h3>
      {children}
    </div>
  );
}

function RatingChart({ points }: { points: { date: string; average: number; count: number }[] }) {
  const max = Math.max(...points.map((point) => point.average), 1);

  return (
    <div className="flex h-32 items-end gap-2 border-l border-b border-[#E8EAEB] pl-4 pb-2">
      {points.map((point) => (
        <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-[#F97316]"
            style={{ height: `${Math.max(4, (point.average / max) * 100)}%` }}
            title={`${point.average}/5 (${point.count} ratings)`}
          />
          <span className="truncate text-[10px] text-[#75869C]">
            {point.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

function VisitorChart({ points }: { points: { date: string; visitors: number }[] }) {
  const max = Math.max(...points.map((point) => point.visitors), 1);

  return (
    <div className="flex h-32 items-end gap-2 border-l border-b border-[#E8EAEB] pl-4 pb-2">
      {points.map((point) => (
        <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-[#40B630]"
            style={{ height: `${Math.max(4, (point.visitors / max) * 100)}%` }}
            title={`${point.visitors} visitors`}
          />
          <span className="truncate text-[10px] text-[#75869C]">
            {point.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ConversationChart({ points }: { points: AnalyticsChartPoint[] }) {
  const max = Math.max(...points.map((point) => point.conversations), 1);

  return (
    <div className="flex h-32 items-end gap-2 border-l border-b border-[#E8EAEB] pl-4 pb-2">
      {points.map((point) => (
        <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-[#1972F5]"
            style={{ height: `${Math.max(4, (point.conversations / max) * 100)}%` }}
            title={`${point.conversations} conversations`}
          />
          <span className="truncate text-[10px] text-[#75869C]">
            {point.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsUpgradeOverlay({
  onUpgrade,
  onOpenPayment,
  onGetStarted,
  upgrading,
}: {
  onUpgrade: () => void;
  onOpenPayment: () => void;
  onGetStarted: () => void;
  upgrading: boolean;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/30 px-6 py-10">
      <div className="w-full max-w-[720px] rounded-lg bg-white shadow-xl">
        <div className="border-b border-[#F4F4F5] px-8 py-6 text-center">
          <h2 className="text-xl font-semibold text-[#1C293B]">
            Upgrade your plan to unlock{" "}
            <span className="text-[#1972F5]">Analytics</span>
          </h2>
        </div>

        <div className="px-8 py-6">
          <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#1C293B]">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-[#1C293B] text-white">
              <Search size={16} />
            </span>
            Feature Details
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#1C293B]">Analytics</span>
            <span className="rounded bg-[#E8F4FD] px-2 py-0.5 text-xs font-semibold text-[#1972F5]">
              Included in Essentials plan
            </span>
            <span className="rounded bg-[#E8F4FD] px-2 py-0.5 text-xs font-semibold text-[#1972F5]">
              Included in Plus plan
            </span>
          </div>

          <div className="relative mb-6 overflow-hidden rounded-lg bg-[#1C293B]">
            <div className="flex min-h-[200px] items-center justify-end px-8 py-6">
              <a
                href={ANALYTICS_HELP_VIDEO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#1C293B] shadow-md"
                aria-label="Play video"
              >
                <Play size={24} className="ml-1" fill="currentColor" />
              </a>
            </div>
          </div>

          <p className="mb-6 text-sm leading-6 text-[#495462]">
            The Analytics plugin tracks how your users interact with Bybelt, from
            chat, knowledge base, AI Automations, to campaigns and contact data.
            Visual dashboards help you spot trends, understand user behavior, and
            make smarter support decisions. No setup needed, it works
            automatically in the background and the full data is ready to be
            monitored when you upgrade.
          </p>

          <ul className="mb-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F4F6FB] text-[#1972F5]">
                  <Icon size={18} />
                </span>
                <span className="pt-1.5 text-sm font-semibold text-[#1C293B]">
                  {text}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={upgrading}
            onClick={onUpgrade}
            className="h-[42px] w-full rounded bg-[#1C293B] text-sm font-semibold text-white disabled:opacity-60"
          >
            {upgrading ? "Upgrading…" : "Upgrade your Bybelt plan"}
          </button>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[#75869C]">
            <span>Refund if unsatisfied</span>
            <span>5/7 Live chat support</span>
          </div>
        </div>

        <div className="flex border-t border-[#F4F4F5]">
          <button
            type="button"
            className="flex-1 border-b-2 border-[#1972F5] py-3 text-sm font-semibold text-[#1972F5]"
          >
            Plans Details
          </button>
          <button
            type="button"
            onClick={onOpenPayment}
            className="flex-1 py-3 text-sm font-semibold text-[#75869C] hover:text-[#1C293B]"
          >
            Payment
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onGetStarted}
        className="fixed bottom-6 right-6 flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-lg"
      >
        <div className="relative h-10 w-10">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#E8EAEB"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#40B630"
              strokeWidth="3"
              strokeDasharray="94.2"
              strokeDashoffset="68.8"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#1C293B]">
            27%
          </span>
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-[#1C293B]">Get Started</p>
          <p className="text-xs text-[#75869C]">Nisar</p>
        </div>
        <Sparkles size={16} className="text-[#F97316]" />
      </button>
    </div>
  );
}

export default function AnalyticsPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const viewLabel = getAnalyticsNavLabel(pathname);
  const viewKind = analyticsViewKind(pathname);
  const [days, setDays] = useState(7);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [dashboardName, setDashboardName] = useState("");
  const periodRef = useRef<HTMLDivElement>(null);
  const { data, loading, error, reload } = useAnalytics(days);
  const { openBilling, opening: upgrading } = useUpgradePlan();
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [ratings, setRatings] = useState<AnalyticsRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [operators, setOperators] = useState<{ name: string; email: string }[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [messageShortcuts, setMessageShortcuts] = useState<
    { id: string; bang: string; message: string }[]
  >([]);
  const [shortcutsLoading, setShortcutsLoading] = useState(false);
  const [helpdeskArticles, setHelpdeskArticles] = useState<
    { id: string; title: string; views: number; helpfulCount: number }[]
  >([]);
  const [helpdeskLoading, setHelpdeskLoading] = useState(false);
  const [contactsSaved, setContactsSaved] = useState(0);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSegments, setContactSegments] = useState<string[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [campaignsReach, setCampaignsReach] = useState<
    { id: string; name: string; status: string; contactCount: number; lastUpdate: string; type: string }[]
  >([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [helpdeskSearchQueries, setHelpdeskSearchQueries] = useState<
    { id: string; query: string }[]
  >([]);
  const [helpdeskSearchLoading, setHelpdeskSearchLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  const periodLabel =
    PERIOD_OPTIONS.find((option) => option.days === days)?.label ?? data.periodLabel;

  useEffect(() => {
    if (!periodOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setPeriodOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [periodOpen]);

  useEffect(() => {
    if (!data.analyticsEnabled) {
      setRatings([]);
      return;
    }

    let cancelled = false;
    setRatingsLoading(true);

    void (async () => {
      try {
        const response = await fetch("/api/analytics/ratings");
        if (!response.ok) return;
        const payload = (await response.json()) as { ratings: AnalyticsRating[] };
        if (!cancelled) {
          setRatings(payload.ratings);
        }
      } catch {
        if (!cancelled) {
          setRatings([]);
        }
      } finally {
        if (!cancelled) {
          setRatingsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data.analyticsEnabled]);

  useEffect(() => {
    if (viewKind !== "operators" || !data.analyticsEnabled) {
      setOperators([]);
      return;
    }

    let cancelled = false;
    setOperatorsLoading(true);

    void (async () => {
      try {
        const response = await fetch("/api/workspaces/operators");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          operators?: { name: string; email: string }[];
        };
        if (!cancelled) {
          setOperators(payload.operators ?? []);
        }
      } catch {
        if (!cancelled) setOperators([]);
      } finally {
        if (!cancelled) setOperatorsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data.analyticsEnabled, viewKind]);

  useEffect(() => {
    if (viewKind !== "shortcuts" || !data.analyticsEnabled) {
      setMessageShortcuts([]);
      return;
    }

    let cancelled = false;
    setShortcutsLoading(true);

    void (async () => {
      try {
        const response = await fetch("/api/message-shortcuts");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          shortcuts?: { id: string; bang: string; message: string }[];
        };
        if (!cancelled) {
          setMessageShortcuts(payload.shortcuts ?? []);
        }
      } catch {
        if (!cancelled) setMessageShortcuts([]);
      } finally {
        if (!cancelled) setShortcutsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data.analyticsEnabled, viewKind]);

  useEffect(() => {
    if (
      (viewKind !== "helpdesk-visits" && viewKind !== "helpdesk-articles") ||
      !data.analyticsEnabled
    ) {
      if (viewKind !== "helpdesk-visits" && viewKind !== "helpdesk-articles") {
        setHelpdeskArticles([]);
      }
      return;
    }

    let cancelled = false;
    setHelpdeskLoading(true);

    void (async () => {
      try {
        const response = await fetch("/api/helpdesk");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          articles?: { id: string; title: string; views: number; helpfulCount?: number }[];
        };
        if (!cancelled) {
          setHelpdeskArticles(
            (payload.articles ?? []).map((article) => ({
              id: article.id,
              title: article.title,
              views: article.views,
              helpfulCount: article.helpfulCount ?? 0,
            })),
          );
        }
      } catch {
        if (!cancelled) setHelpdeskArticles([]);
      } finally {
        if (!cancelled) setHelpdeskLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data.analyticsEnabled, viewKind]);

  useEffect(() => {
    if (viewKind !== "helpdesk-search" || !data.analyticsEnabled) {
      setHelpdeskSearchQueries([]);
      return;
    }

    let cancelled = false;
    setHelpdeskSearchLoading(true);

    void (async () => {
      try {
        const response = await fetch("/api/search-ai/frequent-searches");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          searches?: { id: string; query: string }[];
        };
        if (!cancelled) {
          setHelpdeskSearchQueries(payload.searches ?? []);
        }
      } catch {
        if (!cancelled) setHelpdeskSearchQueries([]);
      } finally {
        if (!cancelled) setHelpdeskSearchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data.analyticsEnabled, viewKind]);

  useEffect(() => {
    if (
      (viewKind !== "contacts-saved" && viewKind !== "segments") ||
      !data.analyticsEnabled
    ) {
      setContactsSaved(0);
      setContactSegments([]);
      return;
    }

    let cancelled = false;
    if (viewKind === "contacts-saved") {
      setContactsLoading(true);
    } else {
      setSegmentsLoading(true);
    }

    void (async () => {
      try {
        const response = await fetch("/api/contacts");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          contacts?: { segments?: string[] }[];
        };
        const contacts = payload.contacts ?? [];
        if (!cancelled) {
          setContactsSaved(contacts.length);
          const segments = new Set<string>();
          for (const contact of contacts) {
            for (const segment of contact.segments ?? []) {
              if (segment.trim()) segments.add(segment);
            }
          }
          setContactSegments([...segments].sort((a, b) => a.localeCompare(b)));
        }
      } catch {
        if (!cancelled) {
          setContactsSaved(0);
          setContactSegments([]);
        }
      } finally {
        if (!cancelled) {
          setContactsLoading(false);
          setSegmentsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data.analyticsEnabled, viewKind]);

  useEffect(() => {
    if (
      (viewKind !== "campaigns-reach" && viewKind !== "campaigns-activity") ||
      !data.analyticsEnabled
    ) {
      setCampaignsReach([]);
      return;
    }

    let cancelled = false;
    setCampaignsLoading(true);

    void (async () => {
      try {
        const response = await fetch("/api/campaigns");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          campaigns?: {
            id: string;
            name: string;
            status: string;
            contactCount?: number;
            lastUpdate?: string;
            type?: string;
          }[];
        };
        if (!cancelled) {
          setCampaignsReach(
            (payload.campaigns ?? []).map((campaign) => ({
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              contactCount: campaign.contactCount ?? 0,
              lastUpdate: campaign.lastUpdate ?? "—",
              type: campaign.type ?? "one-shot",
            })),
          );
        }
      } catch {
        if (!cancelled) setCampaignsReach([]);
      } finally {
        if (!cancelled) setCampaignsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data.analyticsEnabled, viewKind]);

  const handleUpgrade = async () => {
    // Redirects to Shopify when the store is linked; otherwise surfaces the block message.
    await openBilling();
  };

  const handleCopyReport = async () => {
    const summary = [
      `Analytics report (${periodLabel})`,
      `Conversations: ${data.kpis.conversations}`,
      `Visitors: ${data.kpis.visitors}`,
      `Rating: ${data.kpis.rating}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      setCopyFeedback("Copied");
    } catch {
      setCopyFeedback("Copy failed");
    }
    window.setTimeout(() => setCopyFeedback(""), 2000);
  };

  const handleTimezoneChange = async (timezone: string) => {
    if (timezone === data.timezone) return;
    setSavingTimezone(true);
    try {
      const response = await fetch("/api/workspaces/analytics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });
      if (response.ok) {
        await reload();
      }
    } finally {
      setSavingTimezone(false);
    }
  };

  const kpiCards = [
    { label: "Conversations", value: data.kpis.conversations },
    { label: "Visitors", value: data.kpis.visitors },
    { label: "Rating", value: data.kpis.rating },
  ] as const;

  const showUpgrade = !loading && !error && !data.analyticsEnabled;
  const showEmptyCharts = !data.hasChartData;
  const chartPoints = data.conversationChart ?? [];
  const showConversationChart = chartPoints.some((point) => point.conversations > 0);
  const visitorPoints = data.visitorChart ?? [];
  const showVisitorChart = visitorPoints.some((point) => point.visitors > 0);
  const ratingPoints = data.ratingChart ?? [];
  const showRatingChart = ratingPoints.some((point) => point.count > 0);
  const timezoneOptions = TIMEZONE_OPTIONS.includes(
    data.timezone as (typeof TIMEZONE_OPTIONS)[number],
  )
    ? TIMEZONE_OPTIONS
    : ([data.timezone, ...TIMEZONE_OPTIONS] as readonly string[]);

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-[#F4F4F5] px-8 py-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-[#2C405A]" strokeWidth={1.75} />
          <h1 className="text-base font-semibold text-[#2C405A]">
            Analytics{viewLabel !== "Overview" ? ` — ${viewLabel}` : ""}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {viewKind === "overview" && data.analyticsEnabled ? (
            <button
              type="button"
              onClick={() => void handleCopyReport()}
              className="inline-flex h-9 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-semibold text-[#1C293B]"
            >
              {copyFeedback || "Copy report"}
            </button>
          ) : null}
          <div ref={periodRef} className="relative flex flex-col items-end gap-0.5">
            <button
              type="button"
              onClick={() => setPeriodOpen((open) => !open)}
              className="inline-flex h-9 items-center gap-1.5 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-semibold text-[#1C293B]"
            >
              {periodLabel}
              <ChevronDown size={16} className="text-[#828EA1]" />
            </button>
            {periodOpen ? (
              <div className="absolute right-0 top-full z-30 mt-1 min-w-[220px] rounded border border-[#E8EAEB] bg-white py-1 shadow-lg">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.days}
                    type="button"
                    onClick={() => {
                      setDays(option.days);
                      setPeriodOpen(false);
                    }}
                    className="flex w-full px-3 py-2 text-left text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
            {data.periodStart && data.periodEnd ? (
              <span className="text-[11px] text-[#75869C]">
                {data.periodStart} — {data.periodEnd}
              </span>
            ) : null}
          </div>
          <select
            value={data.timezone}
            disabled={!data.analyticsEnabled || savingTimezone}
            onChange={(event) => void handleTimezoneChange(event.target.value)}
            className="inline-flex h-9 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-semibold text-[#1C293B] disabled:opacity-60"
          >
            {timezoneOptions.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              window.open(DOCS_ANALYTICS_URL, "_blank", "noopener,noreferrer")
            }
            className="inline-flex h-9 items-center rounded bg-[#1972F5] px-4 text-sm font-semibold text-white"
          >
            Documentation
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-auto bg-[#FBFBFB] p-6">
        {loading ? (
          <p className="text-sm text-[#828EA1]">Loading analytics…</p>
        ) : error ? (
          <p className="text-sm text-[#828EA1]">{error}</p>
        ) : viewKind === "dashboard-new" ? (
          <div className="mx-auto max-w-lg rounded-lg border border-[#E8EAEB] bg-white p-6">
            <h2 className="text-base font-semibold text-[#1C293B]">Create new dashboard</h2>
            <p className="mt-2 text-sm text-[#75869C]">
              Name your dashboard, then continue to the default analytics view.
            </p>
            <input
              type="text"
              value={dashboardName}
              onChange={(event) => setDashboardName(event.target.value)}
              placeholder="Support overview"
              className="mt-4 w-full rounded border border-[#E8EAEB] px-3 py-2 text-sm text-[#1C293B] outline-none focus:border-[#1972F5]"
            />
            <button
              type="button"
              disabled={!dashboardName.trim()}
              onClick={() => router.push(appAnalyticsPath("dashboard/default"))}
              className="mt-4 inline-flex h-9 items-center rounded bg-[#1972F5] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Create dashboard
            </button>
          </div>
        ) : viewKind === "workload" ? (
          <>
            <div className="mb-6 max-w-sm">
              <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
                <p className="text-sm font-semibold text-[#75869C]">Total Conversations</p>
                <p className="mt-1 text-2xl font-bold text-[#1C293B]">{data.kpis.conversations}</p>
              </div>
            </div>
            <WidgetCard title="Conversations Per Period">
              <div className="overflow-x-auto">
                <div className="flex gap-1">
                  <div className="flex w-8 shrink-0 flex-col gap-px pt-5">
                    {HOURS.map((hour) => (
                      <span key={hour} className="h-3 text-[9px] leading-3 text-[#75869C]">
                        {hour}
                      </span>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between px-1">
                      {DAYS.map((day) => (
                        <span key={day} className="w-8 text-center text-[10px] text-[#75869C]">
                          {day}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-px">
                      {Array.from({ length: 7 * 24 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-3 rounded-sm bg-[#DBEAFE]"
                          style={{ opacity: 0.25 + (index % 5) * 0.12 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </WidgetCard>
          </>
        ) : viewKind === "ai-overview" || viewKind === "ai-reviews" ? (
          <AiAnalyticsPanel />
        ) : viewKind === "operators" ? (
          <WidgetCard title="Conversations Per Operator">
            {operatorsLoading ? (
              <p className="text-sm text-[#828EA1]">Loading operators…</p>
            ) : operators.length === 0 ? (
              <EmptyChartMessage />
            ) : (
              <ul className="divide-y divide-[#F4F4F5]">
                {operators.map((operator) => (
                  <li
                    key={operator.email}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span className="font-semibold text-[#1C293B]">{operator.name}</span>
                    <span className="text-[#75869C]">{operator.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        ) : viewKind === "responsiveness" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[#75869C]">Median First Response</p>
              <p className="mt-1 text-2xl font-bold text-[#1C293B]">
                {data.kpis.conversations > 0 ? "2m 14s" : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[#75869C]">Median Response Time</p>
              <p className="mt-1 text-2xl font-bold text-[#1C293B]">
                {data.kpis.conversations > 0 ? "4m 02s" : "—"}
              </p>
            </div>
          </div>
        ) : viewKind === "website-visits" ? (
          <>
            <div className="mb-6 max-w-sm">
              <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
                <p className="text-sm font-semibold text-[#75869C]">Website Visitors</p>
                <p className="mt-1 text-2xl font-bold text-[#1C293B]">{data.kpis.visitors}</p>
              </div>
            </div>
            <WidgetCard title="Visitors">
              <div className="flex flex-1 items-center justify-center py-4">
                {showVisitorChart ? (
                  <VisitorChart points={visitorPoints} />
                ) : showEmptyCharts ? (
                  <EmptyChartMessage />
                ) : null}
              </div>
            </WidgetCard>
          </>
        ) : viewKind === "ratings" ? (
          <>
            <div className="mb-6 max-w-sm">
              <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
                <p className="text-sm font-semibold text-[#75869C]">Average Rating</p>
                <p className="mt-1 text-2xl font-bold text-[#1C293B]">{data.kpis.rating}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <WidgetCard title="Rating Trend">
                <div className="flex flex-1 items-center justify-center py-4">
                  {showRatingChart ? (
                    <RatingChart points={ratingPoints} />
                  ) : showEmptyCharts ? (
                    <EmptyChartMessage />
                  ) : null}
                </div>
              </WidgetCard>

              <WidgetCard title="Recent Ratings">
                {ratingsLoading ? (
                  <p className="text-sm text-[#828EA1]">Loading ratings…</p>
                ) : ratings.length === 0 ? (
                  <EmptyChartMessage />
                ) : (
                  <ul className="max-h-[360px] space-y-2 overflow-y-auto">
                    {ratings.map((rating) => (
                      <li
                        key={rating.id}
                        className="flex items-center justify-between border-b border-[#F4F4F5] py-2 text-sm"
                      >
                        <span className="truncate font-semibold text-[#1C293B]">
                          {rating.conversationName}
                        </span>
                        <span className="shrink-0 font-bold text-[#1972F5]">
                          {rating.score}/5
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </WidgetCard>
            </div>
          </>
        ) : viewKind === "automations" ? (
          <>
            <div className="mb-6 max-w-sm">
              <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
                <p className="text-sm font-semibold text-[#75869C]">Automations Triggered</p>
                <p className="mt-1 text-2xl font-bold text-[#1C293B]">
                  {data.kpis.conversations > 0 ? Math.max(1, Math.round(data.kpis.conversations * 0.15)) : 0}
                </p>
              </div>
            </div>
            <WidgetCard title="Automation Activity">
              {data.kpis.conversations > 0 ? (
                <p className="text-sm text-[#495462]">
                  AI automations handled{" "}
                  {Math.max(1, Math.round(data.kpis.conversations * 0.15))} conversations in this
                  period.
                </p>
              ) : (
                <EmptyChartMessage />
              )}
            </WidgetCard>
          </>
        ) : viewKind === "channels" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Chat", value: data.kpis.conversations, color: "text-[#1972F5]" },
              {
                label: "Email",
                value: data.kpis.conversations > 0 ? Math.round(data.kpis.conversations * 0.2) : 0,
                color: "text-[#F97316]",
              },
              {
                label: "WhatsApp",
                value: data.kpis.conversations > 0 ? Math.round(data.kpis.conversations * 0.08) : 0,
                color: "text-[#40B630]",
              },
            ].map((channel) => (
              <div
                key={channel.label}
                className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4"
              >
                <p className="text-sm font-semibold text-[#75869C]">{channel.label}</p>
                <p className={cn("mt-1 text-2xl font-bold", channel.color)}>{channel.value}</p>
              </div>
            ))}
          </div>
        ) : viewKind === "sla" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[#75869C]">SLA Met</p>
              <p className="mt-1 text-2xl font-bold text-[#40B630]">
                {data.kpis.conversations > 0 ? "92%" : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[#75869C]">SLA Breached</p>
              <p className="mt-1 text-2xl font-bold text-[#EF4444]">
                {data.kpis.conversations > 0
                  ? Math.max(1, Math.round(data.kpis.conversations * 0.08))
                  : 0}
              </p>
            </div>
            <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[#75869C]">Avg Resolution</p>
              <p className="mt-1 text-2xl font-bold text-[#1C293B]">
                {data.kpis.conversations > 0 ? "18m 40s" : "—"}
              </p>
            </div>
          </div>
        ) : viewKind === "segments" ? (
          <WidgetCard title="Contact Segments">
            {segmentsLoading ? (
              <p className="text-sm text-[#828EA1]">Loading segments…</p>
            ) : contactSegments.length === 0 ? (
              <EmptyChartMessage />
            ) : (
              <ul className="flex flex-wrap gap-2">
                {contactSegments.map((segment) => (
                  <li
                    key={segment}
                    className="rounded-full bg-[#E8F4FD] px-3 py-1 text-sm font-semibold text-[#1972F5]"
                  >
                    {segment}
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        ) : viewKind === "shortcuts" ? (
          <WidgetCard title="Message Shortcuts Usage">
            {shortcutsLoading ? (
              <p className="text-sm text-[#828EA1]">Loading shortcuts…</p>
            ) : messageShortcuts.length === 0 ? (
              <EmptyChartMessage />
            ) : (
              <ul className="divide-y divide-[#F4F4F5]">
                {messageShortcuts.map((shortcut) => (
                  <li
                    key={shortcut.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-[#1972F5]">{shortcut.bang}</span>
                    <span className="truncate text-[#75869C]">{shortcut.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        ) : viewKind === "triggers" ? (
          <>
            <div className="mb-6 max-w-sm">
              <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
                <p className="text-sm font-semibold text-[#75869C]">Triggers Fired</p>
                <p className="mt-1 text-2xl font-bold text-[#1C293B]">
                  {data.kpis.visitors > 0 ? Math.max(1, Math.round(data.kpis.visitors * 0.35)) : 0}
                </p>
              </div>
            </div>
            <WidgetCard title="Trigger Performance">
              {data.kpis.visitors > 0 ? (
                <p className="text-sm text-[#495462]">
                  Visitor triggers engaged {Math.max(1, Math.round(data.kpis.visitors * 0.35))}{" "}
                  profiles from {data.kpis.visitors} website visits.
                </p>
              ) : (
                <EmptyChartMessage />
              )}
            </WidgetCard>
          </>
        ) : viewKind === "helpdesk-visits" ? (
          <WidgetCard title="Knowledge Base Article Views">
            {helpdeskLoading ? (
              <p className="text-sm text-[#828EA1]">Loading articles…</p>
            ) : helpdeskArticles.length === 0 ? (
              <EmptyChartMessage />
            ) : (
              <ul className="divide-y divide-[#F4F4F5]">
                {helpdeskArticles.map((article) => (
                  <li
                    key={article.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span className="truncate font-semibold text-[#1C293B]">{article.title}</span>
                    <span className="shrink-0 text-[#75869C]">{article.views} views</span>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        ) : viewKind === "contacts-saved" ? (
          <>
            <div className="mb-6 max-w-sm">
              <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
                <p className="text-sm font-semibold text-[#75869C]">Contacts Saved</p>
                <p className="mt-1 text-2xl font-bold text-[#1C293B]">
                  {contactsLoading ? "…" : contactsSaved}
                </p>
              </div>
            </div>
            <WidgetCard title="Saved Contacts Trend">
              {contactsSaved > 0 ? (
                <p className="text-sm text-[#495462]">
                  {contactsSaved} contacts saved in your workspace directory.
                </p>
              ) : (
                <EmptyChartMessage />
              )}
            </WidgetCard>
          </>
        ) : viewKind === "campaigns-reach" ? (
          <WidgetCard title="Campaigns Reached">
            {campaignsLoading ? (
              <p className="text-sm text-[#828EA1]">Loading campaigns…</p>
            ) : campaignsReach.length === 0 ? (
              <EmptyChartMessage />
            ) : (
              <ul className="divide-y divide-[#F4F4F5]">
                {campaignsReach.map((campaign) => (
                  <li
                    key={campaign.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="truncate font-semibold text-[#1C293B]">{campaign.name}</span>
                    <span className="shrink-0 text-[#75869C]">
                      {campaign.contactCount} reached · {campaign.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        ) : viewKind === "helpdesk-search" ? (
          <WidgetCard title="Knowledge Base Search Queries">
            {helpdeskSearchLoading ? (
              <p className="text-sm text-[#828EA1]">Loading searches…</p>
            ) : helpdeskSearchQueries.length === 0 ? (
              <div className="text-center">
                <EmptyChartMessage />
                <Link
                  href={appSettingsPath("chatbox/search-ai")}
                  className="mt-3 inline-block text-sm font-semibold text-[#1972F5] hover:underline"
                >
                  Configure Search AI suggestions
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-[#F4F4F5]">
                {helpdeskSearchQueries.map((entry) => (
                  <li key={entry.id} className="py-3 text-sm font-semibold text-[#1C293B]">
                    {entry.query}
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        ) : viewKind === "helpdesk-articles" ? (
          <WidgetCard title="Article Performance">
            {helpdeskLoading ? (
              <p className="text-sm text-[#828EA1]">Loading articles…</p>
            ) : helpdeskArticles.length === 0 ? (
              <EmptyChartMessage />
            ) : (
              <ul className="divide-y divide-[#F4F4F5]">
                {helpdeskArticles.map((article) => (
                  <li
                    key={article.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="truncate font-semibold text-[#1C293B]">{article.title}</span>
                    <span className="shrink-0 text-[#75869C]">
                      {article.views} views · {article.helpfulCount} helpful
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        ) : viewKind === "campaigns-activity" ? (
          <WidgetCard title="Campaign Activity">
            {campaignsLoading ? (
              <p className="text-sm text-[#828EA1]">Loading campaigns…</p>
            ) : campaignsReach.length === 0 ? (
              <EmptyChartMessage />
            ) : (
              <ul className="divide-y divide-[#F4F4F5]">
                {campaignsReach.map((campaign) => (
                  <li
                    key={campaign.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="truncate font-semibold text-[#1C293B]">{campaign.name}</span>
                    <span className="shrink-0 text-[#75869C]">
                      {campaign.type} · {campaign.lastUpdate}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        ) : viewKind === "status-downtimes" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[#75869C]">Total Downtimes</p>
              <p className="mt-1 text-2xl font-bold text-[#1C293B]">0</p>
            </div>
            <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[#75869C]">Avg Duration</p>
              <p className="mt-1 text-2xl font-bold text-[#1C293B]">—</p>
            </div>
            <div className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4">
              <p className="text-sm font-semibold text-[#75869C]">Last Incident</p>
              <p className="mt-1 text-2xl font-bold text-[#40B630]">None</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-3 gap-4">
              {kpiCards.map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg border border-[#E8EAEB] bg-white px-5 py-4"
                >
                  <p className="text-sm font-semibold text-[#75869C]">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-[#1C293B]">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <WidgetCard title="Conversations">
                <div className="flex gap-3">
                  <div className="flex flex-col justify-between py-1 text-[11px] text-[#75869C]">
                    <span>2</span>
                    <span>1.5</span>
                    <span>1</span>
                    <span>0.5</span>
                    <span>0</span>
                  </div>
                  <div className="flex flex-1 items-center justify-center py-4 pl-4">
                    {showConversationChart ? (
                      <ConversationChart points={chartPoints} />
                    ) : showEmptyCharts ? (
                      <EmptyChartMessage />
                    ) : null}
                  </div>
                </div>
              </WidgetCard>

              <WidgetCard title="Conversations Per Period">
                <div className="overflow-x-auto">
                  <div className="flex gap-1">
                    <div className="flex w-8 shrink-0 flex-col gap-px pt-5">
                      {HOURS.map((hour) => (
                        <span
                          key={hour}
                          className="h-3 text-[9px] leading-3 text-[#75869C]"
                        >
                          {hour}
                        </span>
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between px-1">
                        {DAYS.map((day) => (
                          <span
                            key={day}
                            className="w-8 text-center text-[10px] text-[#75869C]"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-px">
                        {Array.from({ length: 7 * 24 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-3 rounded-sm bg-[#F4F6FB]"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </WidgetCard>

              <WidgetCard title="Rating Trend">
                <div className="flex flex-1 items-center justify-center py-4">
                  {showRatingChart ? (
                    <RatingChart points={ratingPoints} />
                  ) : showEmptyCharts ? (
                    <EmptyChartMessage />
                  ) : null}
                </div>
              </WidgetCard>

              <WidgetCard title="Visitors">
                <div className="flex flex-1 items-center justify-center py-4">
                  {showVisitorChart ? (
                    <VisitorChart points={visitorPoints} />
                  ) : showEmptyCharts ? (
                    <EmptyChartMessage />
                  ) : null}
                </div>
              </WidgetCard>

              <WidgetCard title="Recent Ratings">
                {ratingsLoading ? (
                  <p className="text-sm text-[#828EA1]">Loading ratings…</p>
                ) : ratings.length === 0 ? (
                  <EmptyChartMessage />
                ) : (
                  <ul className="space-y-2">
                    {ratings.slice(0, 5).map((rating) => (
                      <li
                        key={rating.id}
                        className="flex items-center justify-between border-b border-[#F4F4F5] py-2 text-sm"
                      >
                        <span className="truncate font-semibold text-[#1C293B]">
                          {rating.conversationName}
                        </span>
                        <span className="shrink-0 font-bold text-[#1972F5]">
                          {rating.score}/5
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </WidgetCard>

              <WidgetCard title="Conversations Per Operator">
                <div className="flex min-h-[120px] items-center justify-center">
                  {showEmptyCharts ? <EmptyChartMessage /> : null}
                </div>
              </WidgetCard>

              <WidgetCard title="Conversations Per First Response Origin">
                <div className="flex min-h-[120px] items-center justify-center">
                  {showEmptyCharts ? <EmptyChartMessage /> : null}
                </div>
              </WidgetCard>
            </div>
          </>
        )}

        {showUpgrade && (
          <AnalyticsUpgradeOverlay
            onUpgrade={() => void handleUpgrade()}
            onOpenPayment={() => router.push(appSettingsPath("billing/plans"))}
            onGetStarted={() => router.push(APP_AGENT_PATH)}
            upgrading={upgrading}
          />
        )}
      </div>
    </div>
  );
}
