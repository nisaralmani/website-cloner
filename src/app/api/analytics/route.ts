import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { conversations, visitors, workspaces } from "@/db/schema";
import { buildConversationChartSeries } from "@/lib/analytics/series";
import { buildRatingChartSeries } from "@/lib/analytics/rating-series";
import { averageWorkspaceRating } from "@/lib/analytics/ratings";
import { requireSession } from "@/lib/auth/request";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = new URL(request.url).searchParams.get("days");
  const parsedDays = daysParam ? Number.parseInt(daysParam, 10) : 7;
  const days = [7, 14, 30].includes(parsedDays) ? parsedDays : 7;

  const db = await getDb();
  const workspaceId = session.workspace.id;

  const workspace = await selectOne(
    db
      .select({
        analyticsEnabled: workspaces.analyticsEnabled,
        analyticsTimezone: workspaces.analyticsTimezone,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId)),
  );

  const chart = await buildConversationChartSeries(db, workspaceId, days);
  const ratingSeries = await buildRatingChartSeries(db, workspaceId, days);
  const enabled = workspace?.analyticsEnabled === 1;
  const timezone = workspace?.analyticsTimezone ?? "UTC";

  if (!enabled) {
    return NextResponse.json({
      analyticsEnabled: false,
      timezone,
      periodLabel: chart.periodLabel,
      periodStart: chart.periodStart,
      periodEnd: chart.periodEnd,
      kpis: { conversations: 0, visitors: 0, rating: 0 },
      conversationChart: chart.conversationChart,
      visitorChart: chart.visitorChart,
      ratingChart: ratingSeries.ratingChart,
      hasChartData: false,
    });
  }

  const [conversationCount] = await db
    .select({ value: count() })
    .from(conversations)
    .where(eq(conversations.workspaceId, workspaceId));

  const [visitorCount] = await db
    .select({ value: count() })
    .from(visitors)
    .where(eq(visitors.workspaceId, workspaceId));

  const conversationsTotal = conversationCount?.value ?? 0;
  const visitorsTotal = visitorCount?.value ?? 0;
  const rating = await averageWorkspaceRating(db, workspaceId);

  return NextResponse.json({
    analyticsEnabled: true,
    timezone,
    periodLabel: chart.periodLabel,
    periodStart: chart.periodStart,
    periodEnd: chart.periodEnd,
    kpis: {
      conversations: conversationsTotal,
      visitors: visitorsTotal,
      rating,
    },
    conversationChart: chart.conversationChart,
    visitorChart: chart.visitorChart,
    ratingChart: ratingSeries.ratingChart,
    hasChartData: chart.hasChartData || conversationsTotal > 0 || ratingSeries.hasRatingData,
  });
}
