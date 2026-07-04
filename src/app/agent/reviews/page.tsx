import type { Metadata } from "next";
import AppShell from "@/components/app/AppShell";
import ReviewQueue from "@/components/agent/ReviewQueue";
import { appPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = appPageMetadata(
  "AI Reviews",
  "Review and approve AI-generated replies.",
);

export default function AiReviewsPage() {
  return (
    <AppShell>
      <ReviewQueue />
    </AppShell>
  );
}
