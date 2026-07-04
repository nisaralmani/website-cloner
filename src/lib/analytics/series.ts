import { and, count, eq, gte, lt } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { visitorChatSessions } from "@/db/schema";

export type AnalyticsChartPoint = {
  date: string;
  conversations: number;
  visitors?: number;
};

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatChartDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatPeriodLabel(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${formatter.format(start)} — ${formatter.format(end)}`;
}

export async function buildConversationChartSeries(
  db: AppDatabase,
  workspaceId: string,
  days = 7,
) {
  const end = startOfUtcDay(new Date());
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const points: AnalyticsChartPoint[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const dayStart = new Date(start);
    dayStart.setUTCDate(start.getUTCDate() + offset);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

    const [conversationRow] = await db
      .select({ value: count() })
      .from(visitorChatSessions)
      .where(
        and(
          eq(visitorChatSessions.workspaceId, workspaceId),
          gte(visitorChatSessions.createdAt, dayStart),
          lt(visitorChatSessions.createdAt, dayEnd),
        ),
      );

    const sessionCount = conversationRow?.value ?? 0;
    points.push({
      date: formatChartDate(dayStart),
      conversations: sessionCount,
      visitors: sessionCount,
    });
  }

  const periodEnd = new Date(end);
  periodEnd.setUTCDate(end.getUTCDate() + 1);

  return {
    conversationChart: points,
    visitorChart: points.map((point) => ({ date: point.date, visitors: point.visitors ?? 0 })),
    periodLabel: formatPeriodLabel(start, end),
    periodStart: formatChartDate(start),
    periodEnd: formatChartDate(end),
    hasChartData: points.some((point) => point.conversations > 0),
  };
}
