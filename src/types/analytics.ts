export interface AnalyticsKpis {
  conversations: number;
  visitors: number;
  rating: number;
}

export interface AnalyticsChartPoint {
  date: string;
  conversations: number;
  visitors?: number;
}

export interface AnalyticsRating {
  id: string;
  score: number;
  conversationId: string;
  conversationName: string;
  createdAt: string;
}

export interface AnalyticsOverview {
  analyticsEnabled: boolean;
  timezone: string;
  periodLabel: string;
  periodStart?: string;
  periodEnd?: string;
  kpis: AnalyticsKpis;
  conversationChart?: AnalyticsChartPoint[];
  visitorChart?: { date: string; visitors: number }[];
  ratingChart?: { date: string; average: number; count: number }[];
  hasChartData: boolean;
}
