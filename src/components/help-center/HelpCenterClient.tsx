"use client";

import { useState } from "react";
import { Activity, BookOpen, LifeBuoy, MessageCircle } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import HelpCenterPublicArticles, {
  HelpCenterSearchInput,
} from "@/components/help-center/HelpCenterPublicArticles";
import {
  MarketingFeatureCard,
  MarketingPrimaryButton,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-ui";
import {
  PUBLIC_CONTACT_URL,
  PUBLIC_DOCS_URL,
  PUBLIC_STATUS_URL,
} from "@/lib/docs-links";
import { appLoginUrl, marketingFeatureUrl, marketingSignupUrl } from "@/lib/marketing-paths";
import Link from "next/link";

const TOPICS = [
  {
    title: "Getting started",
    description: "Set up your workspace, invite teammates, and connect your first channel.",
    href: marketingSignupUrl(),
  },
  {
    title: "Shared inbox",
    description: "Manage conversations, assign tickets, and collaborate with your team.",
    href: marketingFeatureUrl("/shared-inbox"),
  },
  {
    title: "AI Agent",
    description: "Train Hugo, build workflows, and automate customer support.",
    href: marketingFeatureUrl("/ai-agent"),
  },
  {
    title: "Chat widget",
    description: "Install and customize the live chat widget on your website.",
    href: marketingFeatureUrl("/livechat"),
  },
  {
    title: "Billing & plans",
    description: "Compare plans, manage subscriptions, and understand pricing.",
    href: marketingFeatureUrl("/pricing"),
  },
  {
    title: "Contact support",
    description: "Reach our team for account help, sales questions, or technical issues.",
    href: PUBLIC_CONTACT_URL,
  },
] as const;

import type { HelpdeskArticle } from "@/types/helpdesk";

export default function HelpCenterClient({
  initialArticles = [],
}: {
  initialArticles?: HelpdeskArticle[];
}) {
  const [query, setQuery] = useState("");

  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-[#060d1a] px-6 pb-16 pt-20 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(25,114,245,0.35),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <LifeBuoy className="mx-auto h-10 w-10 text-[#60A5FA]" aria-hidden />
          <h1 className="mt-4 text-[2.5rem] font-medium tracking-[-0.03em]">How can we help?</h1>
          <p className="mt-4 text-lg text-white/60">
            Search guides, browse topics, or contact our support team.
          </p>
          <HelpCenterSearchInput query={query} onQueryChange={setQuery} />
        </div>
      </section>

      <MarketingSection variant="white">
        <MarketingSectionHeader
          eyebrow="Articles"
          title="Popular help articles"
          description="Published guides from the Bybelt helpdesk."
        />
        <HelpCenterPublicArticles query={query} initialArticles={initialArticles} />
      </MarketingSection>

      <MarketingSection variant="muted">
        <MarketingSectionHeader
          eyebrow="Topics"
          title="Browse by topic"
          description="Everything you need to get the most out of Bybelt."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((topic) => (
            <a key={topic.title} href={topic.href} className="block">
              <MarketingFeatureCard title={topic.title} description={topic.description} />
            </a>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection variant="white">
        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-[#E2E8F0] bg-white p-8">
            <MessageCircle className="h-8 w-8 text-[#1972F5]" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold text-[#0f172a]">Chat with support</h2>
            <p className="mt-2 text-[15px] text-[#64748b]">
              Log in to your workspace to reach our team from the in-app help menu.
            </p>
            <div className="mt-6">
              <MarketingPrimaryButton href={appLoginUrl()}>
                Open app
              </MarketingPrimaryButton>
            </div>
          </article>
          <article className="rounded-2xl border border-[#E2E8F0] bg-white p-8">
            <BookOpen className="h-8 w-8 text-[#1972F5]" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold text-[#0f172a]">Developer docs</h2>
            <p className="mt-2 text-[15px] text-[#64748b]">
              API references, webhooks, SDK guides, and integration docs live on docs.bybelt.com.
            </p>
            <div className="mt-6">
              <Link
                href={PUBLIC_DOCS_URL}
                className="inline-flex h-12 items-center rounded-full border border-[#E2E8F0] px-7 text-[15px] font-medium text-[#334155] hover:border-[#1972F5] hover:text-[#1972F5]"
              >
                Visit docs.bybelt.com
              </Link>
            </div>
          </article>
          <article className="rounded-2xl border border-[#E2E8F0] bg-white p-8">
            <Activity className="h-8 w-8 text-[#1972F5]" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold text-[#0f172a]">System status</h2>
            <p className="mt-2 text-[15px] text-[#64748b]">
              Check whether Bybelt services are operational or view incident history.
            </p>
            <div className="mt-6">
              <Link
                href={PUBLIC_STATUS_URL}
                className="inline-flex h-12 items-center rounded-full border border-[#E2E8F0] px-7 text-[15px] font-medium text-[#334155] hover:border-[#1972F5] hover:text-[#1972F5]"
              >
                status.bybelt.com
              </Link>
            </div>
          </article>
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
