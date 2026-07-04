import { and, count, eq, gte, lt } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { conversationRatings } from "@/db/schema";

export type RatingChartPoint = {
  date: string;
  average: number;
  count: number;
};

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatChartDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function buildRatingChartSeries(db: AppDatabase, workspaceId: string, days = 7) {
  const end = startOfUtcDay(new Date());
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const points: RatingChartPoint[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const dayStart = new Date(start);
    dayStart.setUTCDate(start.getUTCDate() + offset);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

    const rows = await db
      .select({ score: conversationRatings.score })
      .from(conversationRatings)
      .where(
        and(
          eq(conversationRatings.workspaceId, workspaceId),
          gte(conversationRatings.createdAt, dayStart),
          lt(conversationRatings.createdAt, dayEnd),
        ),
      );

    const total = rows.reduce((sum, row) => sum + row.score, 0);
    const ratingCount = rows.length;
    const average = ratingCount > 0 ? Math.round((total / ratingCount) * 10) / 10 : 0;

    points.push({
      date: formatChartDate(dayStart),
      average,
      count: ratingCount,
    });
  }

  return {
    ratingChart: points,
    hasRatingData: points.some((point) => point.count > 0),
  };
}
