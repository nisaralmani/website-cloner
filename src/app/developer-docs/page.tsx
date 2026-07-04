import Link from "next/link";
import { Code2, Key, Plug, Webhook } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import {
  MarketingPrimaryButton,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-ui";
import { PUBLIC_HELP_CENTER_URL, PUBLIC_STATUS_URL } from "@/lib/docs-links";
import { DOCS_REST_API_URL, DOCS_WEBHOOKS_URL } from "@/lib/docs-links";
import {
  appApiBaseUrl,
  appEmbedScriptUrl,
  appLoginUrl,
  appSettingsUrl,
  marketingFeatureUrl,
} from "@/lib/marketing-paths";
import { marketingPageMetadata } from "@/lib/seo-metadata";

export const metadata = marketingPageMetadata(
  "Developer Hub | Bybelt",
  "API documentation, SDKs, webhooks, and integration guides for Bybelt.",
);
const DOC_SECTIONS = [
  {
    title: "REST API",
    description: "Manage conversations, contacts, workspaces, and settings programmatically.",
    icon: Code2,
    href: DOCS_REST_API_URL,
  },
  {
    title: "Webhooks",
    description: "Receive real-time events for messages, conversation updates, and user actions.",
    icon: Webhook,
    href: DOCS_WEBHOOKS_URL,
  },
  {
    title: "API tokens",
    description: "Create and manage workspace tokens for secure server-side integrations.",
    icon: Key,
    href: appSettingsUrl("workspace/advanced"),
  },
  {
    title: "Shopify",
    description: "Connect your store, sync customers, and surface order context in the inbox.",
    icon: Plug,
    href: appSettingsUrl("workspace/integrations"),
  },
  {
    title: "Integrations",
    description: "Connect Shopify, Slack, Zapier, and 100+ tools to your Bybelt workspace.",
    icon: Plug,
    href: marketingFeatureUrl("/integrations"),
  },
] as const;

export default function DeveloperDocsPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-[#060d1a] px-6 pb-16 pt-20 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(25,114,245,0.35),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <Code2 className="mx-auto h-10 w-10 text-[#60A5FA]" aria-hidden />
          <h1 className="mt-4 text-[2.5rem] font-medium tracking-[-0.03em]">Developer Hub</h1>
          <p className="mt-4 text-lg text-white/60">
            Build on Bybelt with our REST API, webhooks, chat SDKs, and marketplace integrations.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <MarketingPrimaryButton href={appLoginUrl()}>
              Get API access
            </MarketingPrimaryButton>
            <Link
              href={marketingFeatureUrl("/integrations")}
              className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-7 text-[15px] font-medium text-white hover:bg-white/10"
            >
              Browse integrations
            </Link>
          </div>
        </div>
      </section>

      <MarketingSection variant="white">
        <MarketingSectionHeader
          eyebrow="Documentation"
          title="Everything developers need"
          align="center"
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {DOC_SECTIONS.map(({ title, description, icon: Icon, href }) => (
            <Link
              key={title}
              href={href}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition-colors hover:border-[#1972F5]"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF3FE]">
                <Icon className="h-5 w-5 text-[#1972F5]" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a]">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">{description}</p>
            </Link>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection variant="muted">
        <div className="mx-auto max-w-3xl space-y-10">
          <section id="rest-api" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">REST API</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Authenticate with a workspace API token and call JSON endpoints under{" "}
              <code className="rounded bg-[#F1F5F9] px-1">{appApiBaseUrl()}</code>.
            </p>
          </section>
          <section id="webhooks" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">Webhooks</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Configure outbound webhooks in{" "}
              <Link href={appSettingsUrl("workspace/advanced")} className="font-semibold text-[#1972F5] hover:underline">
                Settings → Workspace → Advanced
              </Link>
              . Events include visitor and operator messages.
            </p>
          </section>
          <section id="api-tokens" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">API tokens</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Create tokens scoped to your workspace in{" "}
              <Link href={appSettingsUrl("workspace/advanced")} className="font-semibold text-[#1972F5] hover:underline">
                Settings → Workspace → Advanced
              </Link>
              .
            </p>
          </section>
          <section id="helpdesk" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">Helpdesk API</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Publish articles via the helpdesk API and expose them on{" "}
              <Link href={PUBLIC_HELP_CENTER_URL} className="font-semibold text-[#1972F5] hover:underline">
                help.bybelt.com
              </Link>{" "}
              automatically.
            </p>
          </section>
          <section id="campaigns" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">Campaigns API</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Create campaigns, attach contacts, and send email outreach from your workspace.
            </p>
          </section>
          <section id="contacts" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">Contacts API</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Import, segment, and export contacts for CRM workflows and campaign targeting.
            </p>
          </section>
          <section id="analytics" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">Analytics API</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Read conversation volume, ratings, and operator performance metrics from your workspace.
            </p>
          </section>
          <section id="visitors" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">Visitors API</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Track live visitors, session metadata, and geographic activity from the MagicMap panel.
            </p>
          </section>
          <section id="ai-agent" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">AI Agent API</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Train Hugo, configure routing rules, and automate replies from{" "}
              <Link href={appSettingsUrl("workspace/data")} className="font-semibold text-[#1972F5] hover:underline">
                Settings → Workspace → Data
              </Link>
              .
            </p>
          </section>
          <section id="inbox" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">Inbox API</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              List conversations, send messages, assign operators, and manage conversation state programmatically.
            </p>
          </section>
          <section id="integrations" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">Integrations & plugins</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Install marketplace plugins or connect third-party tools from{" "}
              <Link href={appSettingsUrl("workspace/integrations")} className="font-semibold text-[#1972F5] hover:underline">
                Settings → Workspace → Integrations
              </Link>
              .
            </p>
          </section>
          <section id="shopify" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">Shopify integration</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Install Bybelt Chat on your Shopify store from{" "}
              <Link href={appSettingsUrl("workspace/integrations")} className="font-semibold text-[#1972F5] hover:underline">
                Settings → Workspace → Integrations
              </Link>
              . Customer and order context syncs into the inbox; outbound workspace webhooks include{" "}
              <code className="rounded bg-[#F1F5F9] px-1">integration:shopify_order</code>,{" "}
              <code className="rounded bg-[#F1F5F9] px-1">integration:shopify_refund</code>,{" "}
              <code className="rounded bg-[#F1F5F9] px-1">integration:shopify_fulfilled</code>,{" "}
              <code className="rounded bg-[#F1F5F9] px-1">integration:shopify_cancelled</code>,{" "}
              <code className="rounded bg-[#F1F5F9] px-1">integration:shopify_paid</code>,{" "}
              <code className="rounded bg-[#F1F5F9] px-1">integration:shopify_sync</code>,{" "}
              <code className="rounded bg-[#F1F5F9] px-1">integration:shopify_redact</code>,{" "}
              <code className="rounded bg-[#F1F5F9] px-1">integration:shopify_delete</code>, and GDPR events.
            </p>
          </section>
          <section id="chat-widget" className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#0f172a]">Chat widget embed</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
              Add the Bybelt chat widget to any site with a short script snippet from{" "}
              <Link href={appSettingsUrl("chatbox/behavior")} className="font-semibold text-[#1972F5] hover:underline">
                Settings → Chatbox → Behavior
              </Link>
              . The loader is served from{" "}
              <code className="rounded bg-[#F1F5F9] px-1">{appEmbedScriptUrl()}</code>.
            </p>
          </section>
        </div>
      </MarketingSection>

      <MarketingSection variant="white">
        <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-4 text-sm font-semibold">
          <Link href={PUBLIC_STATUS_URL} className="text-[#1972F5] hover:underline">
            System status
          </Link>
          <Link href={appLoginUrl()} className="text-[#1972F5] hover:underline">
            Get API access
          </Link>
        </div>
      </MarketingSection>

      <MarketingSection variant="white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-[#0f172a]">Quick start</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-[#0f172a] p-4 text-left text-sm text-[#e2e8f0]">
            {`curl ${appApiBaseUrl()}/conversations \\
  -H "Authorization: Bearer bybelt_your_token"`}
          </pre>
          <p className="mt-4 text-sm text-[#64748b]">
            Generate tokens in Settings → Workspace → Advanced → API tokens.
          </p>
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
