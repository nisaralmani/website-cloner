import AppShell from "@/components/app/AppShell";
import AnalyticsNav from "@/components/analytics/AnalyticsNav";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="flex min-w-0 flex-1 overflow-hidden">
        <AnalyticsNav />
        {children}
      </div>
    </AppShell>
  );
}
