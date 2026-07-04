import type { Metadata } from "next";
import { Suspense } from "react";
import AppShell from "@/components/app/AppShell";
import ContactsPanel from "@/components/contacts/ContactsPanel";

export const metadata: Metadata = {
  title: "Contacts | Bybelt",
};

export default function ContactsPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <ContactsPanel />
      </Suspense>
    </AppShell>
  );
}
