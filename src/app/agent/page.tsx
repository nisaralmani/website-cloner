import type { Metadata } from "next";
import AppShell from "@/components/app/AppShell";
import AgentWelcome from "@/components/agent/AgentWelcome";
import { appPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = appPageMetadata(
  "AI Agent",
  "Train Hugo and automate customer support with Bybelt AI Agent.",
);

export default function AgentPage() {
  return (
    <AppShell>
      <AgentWelcome />
    </AppShell>
  );
}
