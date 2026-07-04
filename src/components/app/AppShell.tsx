import InboxSidebar from "@/components/inbox/InboxSidebar";
import { ContactFilterProvider } from "@/components/contacts/ContactFilterContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ContactFilterProvider>
      <div className="flex h-screen w-full overflow-hidden bg-white text-[#2c405a]">
        <InboxSidebar />
        {children}
      </div>
    </ContactFilterProvider>
  );
}
