import { PUBLIC_CONTACT_URL } from "@/lib/docs-links";
import { marketingSignupPath } from "@/lib/marketing-paths";

export type MarketingPageVariant =
  | "pricing"
  | "ai-agent"
  | "livechat"
  | "hugo"
  | "shared-inbox"
  | "chatbot"
  | "integrations"
  | "apps"
  | "signup"
  | "feature";

export type MarketingPageDefinition = {
  slug: string;
  documentTitle: string;
  description: string;
  h1: string;
  subtitle: string;
  variant: MarketingPageVariant;
};

const CORE_PAGES: MarketingPageDefinition[] = [
  {
    slug: "pricing",
    documentTitle: "Pricing and plans - Bybelt best deals - Bybelt",
    description:
      "Try any Bybelt plan free for 14 days. Flat pricing per workspace with Free, Mini, Essentials, and Plus plans.",
    h1: "Try any plan for free for 14 days",
    subtitle:
      "Every new account unlocks full access to all Bybelt features, letting you explore and see if we're the right fit for your needs.",
    variant: "pricing",
  },
  {
    slug: "ai-agent",
    documentTitle: "AI Agent - Build your perfect support agent - Bybelt",
    description:
      "Train Hugo to answer FAQs, qualify leads, and automate customer support across every channel.",
    h1: "Build your perfect AI Agent in 4 steps",
    subtitle:
      "Train, workflow, deploy, and measure — everything you need to automate customer support with AI.",
    variant: "ai-agent",
  },
  {
    slug: "apps",
    documentTitle: "Discover our customer service Apps for mobile & desktop - Bybelt",
    description:
      "Download Bybelt apps for Windows, macOS, iOS, and Android to support customers from anywhere.",
    h1: "Enjoy our customer service app for mobile & desktop",
    subtitle:
      "Desktop and mobile apps keep your team connected to the shared inbox, wherever they are.",
    variant: "apps",
  },
  {
    slug: "integrations",
    documentTitle: "Integrate Bybelt with your favorite tools - Bybelt",
    description:
      "Connect Bybelt with 100+ integrations including Shopify, Slack, Zapier, and your favorite tools.",
    h1: "Connect Bybelt to your favorite tools",
    subtitle:
      "Integrate your stack in minutes with native connectors and an open API for custom workflows.",
    variant: "integrations",
  },
  {
    slug: "hugo",
    documentTitle: "Hugo - Your AI support agent teammate - Bybelt",
    description:
      "Meet Hugo, the brand new AI-powered support agent built into Bybelt.",
    h1: "Meet Hugo, your brand's most efficient support teammate",
    subtitle:
      "Hugo learns from your content, resolves inquiries automatically, and hands off to humans when needed.",
    variant: "hugo",
  },
  {
    slug: "signup",
    documentTitle: "Sign up - Start your free trial - Bybelt",
    description:
      "Create your Bybelt account and start a 14-day free trial with full access to all features.",
    h1: "Start your 14-day free trial",
    subtitle:
      "All Bybelt features included. No credit card required to explore the platform.",
    variant: "signup",
  },
  {
    slug: "unleash",
    documentTitle: "Unleash - Bybelt",
    description:
      "Follow Bybelt Unleash for product updates, beta features, and the public roadmap.",
    h1: "Discover what's next for Bybelt",
    subtitle:
      "Product updates, beta programs, and the features we're building for AI-first support teams.",
    variant: "feature",
  },
];

const FEATURE_PAGES: MarketingPageDefinition[] = [
  {
    slug: "livechat",
    documentTitle: "Free Website Chat Widget for Business - Get Started Today - Bybelt",
    description:
      "Add a lightweight chat widget to your website and talk to visitors in real-time with Bybelt.",
    h1: "Let your customers chat with your teams the way they chat with their friends",
    subtitle:
      "Bybelt chat widget helps your team improve customer satisfaction through proactive conversations and seamless handovers.",
    variant: "livechat",
  },
  {
    slug: "chatbot",
    documentTitle: "AI Customer Support Chatbot Software - Bybelt",
    description:
      "Deploy an omnichannel AI chatbot trained on your knowledge base and website content.",
    h1: "Unite AI chatbots and support teams for a better collaboration, not competition",
    subtitle:
      "Build an AI chatbot that answers FAQs across your website chat, email, and messaging channels.",
    variant: "chatbot",
  },
  {
    slug: "crm",
    documentTitle: "CRM software made for small business - #1 For SMBs - Bybelt",
    description:
      "Organize customer data in Bybelt's built-in CRM and personalize every conversation.",
    h1: "Enhance your customer experience with easy access to data",
    subtitle:
      "Synchronize leads and customer data in a single CRM with full conversation history at your fingertips.",
    variant: "feature",
  },
  {
    slug: "shared-inbox",
    documentTitle: "The Shared Inbox for teams dedicated to SMBs - Bybelt",
    description:
      "Centralize inbound conversations from every channel into one collaborative inbox.",
    h1: "A shared inbox to bring seamless collaboration in one place",
    subtitle:
      "All your inbound conversations from all channels go into one collaborative inbox your team can manage together.",
    variant: "shared-inbox",
  },
  {
    slug: "artificial-intelligence",
    documentTitle: "AI for customer service teams - Try for free - Bybelt",
    description:
      "Smart replies, summaries, and a support copilot trained on your content.",
    h1: "Artificial intelligence made to support your teams and customers",
    subtitle:
      "Smart replies, auto-summaries, writing tools, and a support copilot trained on your content.",
    variant: "feature",
  },
  {
    slug: "campaigns",
    documentTitle: "Customer Engagement Software - #1 for Businesses - Bybelt",
    description:
      "Send marketing emails and in-app messages to retarget customers.",
    h1: "Build journeys that drive better customer experiences",
    subtitle:
      "Send marketing emails and in-app messages to engage users and drive conversions.",
    variant: "feature",
  },
  {
    slug: "analytics",
    documentTitle: "Customer service analytics and reporting software - Bybelt",
    description:
      "Track support performance with day-by-day metrics for your team.",
    h1: "Turn support data into growth levers",
    subtitle:
      "Get day-by-day metrics on how your support performs and identify what to optimize.",
    variant: "feature",
  },
  {
    slug: "knowledge",
    documentTitle: "The Knowledge base software for a Bybelt Knowledge Management - Bybelt",
    description:
      "Create a help center that fits your brand and lets users search for answers.",
    h1: "Let your customers help themselves with a knowledge base",
    subtitle:
      "Create, edit, and manage help articles in a knowledge base that fits your brand.",
    variant: "feature",
  },
  {
    slug: "ticket-center",
    documentTitle: "The Modern Help Desk Ticketing Management Software - Try For Free - Bybelt",
    description:
      "Turn conversations into tickets and track complex customer issues to resolution.",
    h1: "Resolve issues without creating tickets",
    subtitle:
      "Assign, prioritize, and track support tickets without leaving your shared inbox.",
    variant: "feature",
  },
  {
    slug: "status-page",
    documentTitle: "Status Page Software : Create a Public Status Page - Bybelt",
    description:
      "Communicate incidents and uptime to customers with a branded status page.",
    h1: 'Keep your customers updated from "Total outage" to "Resolved"',
    subtitle:
      "Publish a status page that shows uptime, incidents, and maintenance windows.",
    variant: "feature",
  },
  {
    slug: "chat-sdk",
    documentTitle: "Chat SDK : Modern and lightweight SDK for Mobile and Web App - Bybelt",
    description:
      "Embed Bybelt chat in native iOS, Android, and React apps with the Chat SDK.",
    h1: "Infrastructure and tools to empower mobile and web app companies",
    subtitle:
      "Use Bybelt Chat SDKs to deliver the same support experience inside iOS, Android, and React apps.",
    variant: "feature",
  },
];

export const MARKETING_PAGES: MarketingPageDefinition[] = [
  ...CORE_PAGES,
  ...FEATURE_PAGES,
];

export type MarketingPageSlug = (typeof MARKETING_PAGES)[number]["slug"];

export const MARKETING_PAGE_BY_SLUG = Object.fromEntries(
  MARKETING_PAGES.map((page) => [page.slug, page]),
) as Record<MarketingPageSlug, MarketingPageDefinition>;

export const PRICING_PLANS = [
  {
    name: "Free",
    badge: null as string | null,
    price: "Free Forever",
    priceNote: null as string | null,
    description:
      "For solopreneurs and entrepreneurs. Your first shared inbox.",
    cta: "Use Bybelt for free",
    ctaHref: marketingSignupPath(),
    features: [
      { title: "Website chat widget", detail: "Engage with visitors directly on your website." },
      { title: "2 seats included", detail: null },
      { title: "Shared inbox", detail: null },
      { title: "Mobile applications", detail: null },
      { title: "Chat SDKs", detail: null },
      { title: "Contact form", detail: null },
      { title: "E-Commerce integrations", detail: null },
      { title: "Push notifications", detail: null },
    ],
  },
  {
    name: "Mini",
    badge: null,
    price: "45",
    priceNote: "Per month, per workspace",
    description:
      "For early-stage companies who want to improve their customer service.",
    cta: "Start my trial for free",
    ctaHref: marketingSignupPath(),
    features: [
      { title: "Shared email inbox", detail: "Manage all customer emails in one collaborative inbox." },
      { title: "4 seats included", detail: null },
      { title: "Shortcuts", detail: null },
      { title: "Chat triggers", detail: null },
      { title: "Private notes", detail: null },
      { title: "Custom email domain", detail: null },
      { title: "Unlimited data retention", detail: null },
      { title: "Internal search", detail: null },
    ],
  },
  {
    name: "Essentials",
    badge: null,
    price: "95",
    priceNote: "Per month, per workspace",
    description:
      "For small companies requiring a full-featured customer support platform. You get all our flagship features.",
    cta: "Start my trial for free",
    ctaHref: marketingSignupPath(),
    features: [
      { title: "Customer data management", detail: "Organize and utilize customer information effectively." },
      { title: "10 seats included", detail: null },
      { title: "Omnichannel inbox", detail: null },
      { title: "Workflow automation builder", detail: null },
      { title: "Omnichannel AI Chatbot", detail: null },
      { title: "Knowledge base", detail: null },
      { title: "Analytics", detail: null },
      { title: "Routing rules & Assignment", detail: null },
    ],
  },
  {
    name: "Plus",
    badge: "Best value",
    price: "295",
    priceNote: "Per month, per workspace",
    description:
      "For medium-sized businesses looking for an AI-powered omnichannel customer support software, plus all our features.",
    cta: "Start my trial for free",
    ctaHref: marketingSignupPath(),
    features: [
      { title: "AI-First Support Suite", detail: "Complete AI-first suite of tools for support" },
      { title: "20+ seats (and more)", detail: null },
      { title: "Unlimited Task automations", detail: null },
      { title: "Ticketing system", detail: null },
      { title: "100+ integrations", detail: null },
      { title: "White labelling", detail: null },
      { title: "Enhanced rate limits", detail: null },
      { title: "Advanced analytics", detail: null },
    ],
  },
] as const;

export const PRICING_ENTERPRISE = {
  title: "Enterprise",
  subtitle: "Need something more custom?",
  description:
    "Created for large-scale companies willing to benefit from dedicated features, custom onboarding and personalized SLAs.",
  features: [
    "Dedicated onboarding",
    "Personalized SLA",
    "Enhanced rate limits",
    "Custom features",
    "Unique pricing",
    "Team training",
  ],
  cta: "Contact us",
  ctaHref: PUBLIC_CONTACT_URL,
} as const;

export const PRICING_FAQ = [
  {
    question: "Will I pay more for some features?",
    answer:
      "No hidden fees — each plan includes a fixed set of features. Upgrading unlocks more capabilities at a flat workspace price.",
  },
  {
    question: "Is VAT included in plan prices?",
    answer:
      "Displayed prices exclude VAT where applicable. Tax is calculated at checkout based on your billing country.",
  },
  {
    question: "Do you offer discounts on multiple Bybelt Workspaces?",
    answer:
      "Yes. Teams managing multiple workspaces can contact sales for volume pricing.",
  },
  {
    question: "What does a Bybelt Workspace stand for?",
    answer:
      "A workspace is your team's shared Bybelt environment — one inbox, one knowledge base, and one set of integrations.",
  },
  {
    question: "I'm running a nonprofit / I am a student. Do you offer discounts?",
    answer:
      "Bybelt offers special programs for nonprofits and students. Contact support to learn about eligibility.",
  },
  {
    question: "Is it possible to pay yearly?",
    answer:
      "Yes. Annual billing is available on paid plans with a discount compared to monthly billing.",
  },
  {
    question: "Why are there no limits on the number of conversations?",
    answer:
      "Bybelt uses flat workspace pricing so your team can scale support without per-conversation overages.",
  },
] as const;

export const MARKETING_SITEMAP_PATHS = [
  "/",
  ...MARKETING_PAGES.map((page) => `/${page.slug}`),
] as const;
