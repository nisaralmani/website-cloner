import AppShell from "@/components/app/AppShell";
import HelpdeskNav from "@/components/helpdesk/HelpdeskNav";

export default function HelpdeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="flex min-w-0 flex-1 overflow-hidden">
        <HelpdeskNav />
        {children}
      </div>
    </AppShell>
  );
}
