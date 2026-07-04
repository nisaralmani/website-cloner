import type { Metadata } from "next";
import AnalyticsPanel from "@/components/analytics/AnalyticsPanel";
import { ANALYTICS_NAV } from "@/lib/analytics-routes";
import { APP_ANALYTICS_PATH } from "@/lib/marketing-paths";

export const metadata: Metadata = {
  title: "Analytics | Bybelt",
};

export function generateStaticParams() {
  const slugs = ANALYTICS_NAV.flatMap((section) =>
    section.items.map((item) => ({
      slug: item.href.replace(`${APP_ANALYTICS_PATH}/`, "").split("/"),
    })),
  );
  return [{ slug: [] }, ...slugs];
}

export default function AnalyticsPage() {
  return <AnalyticsPanel />;
}
