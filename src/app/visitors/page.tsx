import type { Metadata } from "next";
import AppShell from "@/components/app/AppShell";
import VisitorsPanel from "@/components/visitors/VisitorsPanel";

export const metadata: Metadata = {
  title: "Visitors | Bybelt",
};

export default function VisitorsPage() {
  return (
    <AppShell>
      <VisitorsPanel />
    </AppShell>
  );
}
