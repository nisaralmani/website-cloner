import AppShell from "@/components/app/AppShell";
import CampaignsNav from "@/components/campaigns/CampaignsNav";

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="flex min-w-0 flex-1 overflow-hidden">
        <CampaignsNav />
        {children}
      </div>
    </AppShell>
  );
}
