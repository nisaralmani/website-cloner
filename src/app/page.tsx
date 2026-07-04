import type { Metadata } from "next";
import { Suspense } from "react";
import InboxApp from "@/components/inbox/InboxApp";

export const metadata: Metadata = {
  title: "Inbox | Bybelt",
};

export default function Home() {
  return (
    <Suspense fallback={null}>
      <InboxApp />
    </Suspense>
  );
}
