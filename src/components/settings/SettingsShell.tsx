import InboxSidebar from "@/components/inbox/InboxSidebar";
import SettingsNav from "@/components/settings/SettingsNav";
import SettingsTopBar from "@/components/settings/SettingsTopBar";

export default function SettingsShell({
  breadcrumb,
  children,
}: {
  breadcrumb?: [string, string];
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-[#2c405a]">
      <InboxSidebar />
      <SettingsNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <SettingsTopBar breadcrumb={breadcrumb} />
        {children}
      </div>
    </div>
  );
}
