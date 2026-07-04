import {
  PUBLIC_CONTACT_URL,
  PUBLIC_DOCS_URL,
  PUBLIC_HELP_CENTER_URL,
} from "@/lib/docs-links";
import { marketingExternalUrl, marketingFeaturePath } from "@/lib/marketing-paths";

export type MarketingNavItem =
  | { label: string; hasDropdown: true }
  | { label: string; href: string };

export const MARKETING_NAV: MarketingNavItem[] = [
  { label: "Features", hasDropdown: true },
  { label: "AI Agent", href: marketingFeaturePath("/ai-agent") },
  { label: "Apps", href: marketingFeaturePath("/apps") },
  { label: "Pricing", href: marketingFeaturePath("/pricing") },
  { label: "Integrations", href: marketingFeaturePath("/integrations") },
  { label: "Help", hasDropdown: true },
];

export const HERO_BENEFIT_PILLS = [
  {
    title: "All-in-one",
    subtitle: "Omnichannel inbox",
    accent: "bg-[#40B630]",
  },
  {
    title: "AI Agents",
    subtitle: "Build your AI workflows",
    accent: "bg-[#8B5CF6]",
  },
  {
    title: "Flat pricing",
    subtitle: "Lower your cost per agent",
    accent: "bg-[#1972F5]",
  },
] as const;

export const HOME_HERO_STATS = [
  { value: "10K+", label: "Teams worldwide" },
  { value: "50M+", label: "Conversations handled" },
  { value: "70%", label: "Tickets auto-resolved" },
  { value: "4.8★", label: "Average rating" },
] as const;

export const HOME_BENTO_FEATURES = [
  {
    title: "Shared Inbox",
    description:
      "Every channel — chat, email, WhatsApp, social — in one collaborative workspace. Assign, tag, and resolve without switching tabs.",
    href: marketingFeaturePath("/shared-inbox"),
    icon: "inbox" as const,
    iconBg: "bg-[#EBF3FE]",
    iconColor: "text-[#1972F5]",
  },
  {
    title: "AI Agents",
    description:
      "Train agents on your docs and let them handle routine questions 24/7. Escalate to humans when it matters.",
    href: marketingFeaturePath("/ai-agent"),
    icon: "bot" as const,
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#8B5CF6]",
  },
  {
    title: "Live Chat Widget",
    description: "Embed a beautiful chat widget on your site. Customize colors, copy, and behavior to match your brand.",
    href: marketingFeaturePath("/livechat"),
    icon: "message" as const,
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#16A34A]",
  },
  {
    title: "Analytics",
    description:
      "Track response times, satisfaction scores, and team performance with dashboards built for support leaders.",
    href: marketingFeaturePath("/analytics"),
    icon: "chart" as const,
    iconBg: "bg-[#FFEDD5]",
    iconColor: "text-[#EA580C]",
  },
  {
    title: "Campaigns",
    description:
      "Proactive outreach via email and chat. Announce features, recover carts, and nurture customers at scale.",
    href: marketingFeaturePath("/campaigns"),
    icon: "megaphone" as const,
    iconBg: "bg-[#FEE2E2]",
    iconColor: "text-[#DC2626]",
  },
  {
    title: "Knowledge Base",
    description:
      "Self-service help center with AI-powered search. Deflect tickets before they reach your inbox.",
    href: marketingFeaturePath("/helpdesk"),
    icon: "book" as const,
    iconBg: "bg-[#E0F2FE]",
    iconColor: "text-[#0284C7]",
  },
] as const;

export const HOME_WORKFLOW_STEPS = [
  {
    title: "Connect your channels",
    description:
      "Add the chat widget to your website, connect email, WhatsApp, Messenger, and more. Everything flows into one inbox.",
    detail: "Setup in under 5 minutes",
  },
  {
    title: "Train your AI agent",
    description:
      "Import your help docs, website content, and FAQs. Bybelt learns your product and starts answering common questions instantly.",
    detail: "No code required",
  },
  {
    title: "Delight your customers",
    description:
      "Your team handles complex issues while AI resolves the rest. Measure satisfaction and iterate with built-in analytics.",
    detail: "Average 70% ticket deflection",
  },
] as const;

export const CUSTOMER_LOGOS = [
  { name: "emma", src: "/images/marketing/logos/emma.svg", height: 37 },
  { name: "airfrance", src: "/images/marketing/logos/airfrance.svg", height: 24 },
  { name: "decathlon", src: "/images/marketing/logos/decathlon.svg", height: 32 },
  { name: "refugiees", src: "/images/marketing/logos/refugiees.svg", height: 34 },
  { name: "hotelbb", src: "/images/marketing/logos/hotelbb.svg", height: 37 },
  { name: "reedsy", src: "/images/marketing/logos/reedsy.svg", height: 32 },
  { name: "beemenergy", src: "/images/marketing/logos/beemenergy.svg", height: 32 },
  {
    name: "thecompaniesapi",
    src: "/images/marketing/logos/thecompaniesapi.svg",
    height: 35,
  },
  { name: "scribe", src: "/images/marketing/logos/scribe.svg", height: 24 },
  { name: "publer", src: "/images/marketing/logos/publer.svg", height: 42 },
] as const;

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Testimonials 4.5", href: marketingFeaturePath("/#testimonials") },
      { label: "Comparisons", href: marketingExternalUrl("/comparisons/"), external: true },
      { label: "Alternatives", href: marketingExternalUrl("/alternatives/"), external: true },
      { label: "Integrations", href: marketingFeaturePath("/integrations") },
      { label: "Developer Hub", href: PUBLIC_DOCS_URL, external: true },
      { label: "Ask a demo", href: PUBLIC_CONTACT_URL, external: true },
    ],
  },
  {
    title: "Features",
    links: [
      { label: "Chat Widget", href: marketingFeaturePath("/livechat") },
      { label: "AI Agents", href: marketingFeaturePath("/ai-agent") },
      { label: "AI Chatbot", href: marketingFeaturePath("/chatbot") },
      { label: "Shared Inbox", href: marketingFeaturePath("/shared-inbox") },
      { label: "CRM", href: marketingFeaturePath("/crm") },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: marketingExternalUrl("/about/"), external: true },
      { label: "Contact us", href: PUBLIC_CONTACT_URL, external: true },
      { label: "Careers", href: marketingExternalUrl("/careers/"), external: true },
      { label: "Brand Assets", href: marketingExternalUrl("/brand/"), external: true },
      { label: "Partnerships", href: marketingExternalUrl("/partnerships/"), external: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Read our blog", href: marketingExternalUrl("/blog/"), external: true },
      { label: "Help Center", href: PUBLIC_HELP_CENTER_URL, external: true },
      { label: "Security", href: marketingExternalUrl("/security/"), external: true },
      { label: "Terms of use", href: marketingExternalUrl("/terms/"), external: true },
      { label: "Privacy policy", href: marketingExternalUrl("/privacy/"), external: true },
    ],
  },
];

export const PLATFORM_FEATURES = [
  { title: "AI Helpdesk", description: "Give superpowers to your teams and customers." },
  { title: "Chat widget", description: "Support from your website & mobile apps." },
  { title: "Shared Inbox", description: "Centralize your inbound communications." },
  { title: "Knowledge Base", description: "Make your customers more autonomous." },
  { title: "Support CRM", description: "Organize your customer data in a CRM." },
  {
    title: "Support Analytics",
    description: "Monitor and track your teams' performances.",
  },
] as const;

export const AGENT_STEPS = [
  {
    id: "train",
    step: "Step 1",
    title: "Train your AI",
    description:
      "Teach Bybelt about your product or business, using the public and private resources you already have. We automatically browse your website for you, but you can also import PDFs and write Knowledge Base articles.",
    poster: "/images/marketing/agents/train-preview.webp",
  },
  {
    id: "create",
    step: "2",
    title: "Create a Workflow",
    description:
      "Create an AI Agent workflow, using our no-code AI Agent builder or browse through our library of templates to kickstart your new support experience.",
    poster: "/images/marketing/agents/create-preview.webp",
  },
  {
    id: "deploy",
    step: "3",
    title: "Test & Deploy Workflow",
    description:
      "Deploy your AI Agent workflow, choosing which messaging channel you want it to trigger from: Web chat widget, WhatsApp, Messenger, Instagram, and even email.",
    poster: "/images/marketing/agents/deploy-preview.webp",
  },
  {
    id: "measure",
    step: "4",
    title: "Validate & Measure",
    description:
      "See the messages that your users exchanged with your AI Agent. Refine your AI Agent if an answer was invalid. Quickly iterate to automate most of your customer support.",
    poster: "/images/marketing/agents/measure-preview.webp",
  },
] as const;

export const FEATURES_POPULAR = [
  {
    label: "Shared Inbox",
    title: "Centralize all your inbound messages",
    description:
      "All your inbound conversations from all channels go into one collaborative inbox. Your team can access, manage, and respond to messages efficiently.",
    channels: ["Chat Widget", "Email", "WhatsApp", "Messenger", "+ 8 other channels"],
    cta: "See all messaging channels",
    href: marketingFeaturePath("/shared-inbox"),
    poster: "/images/marketing/hero-screenshot.png",
    reverse: false,
  },
  {
    label: "Knowledge Base",
    title: "Let your users search for answers themselves",
    description:
      "Leverage the power of asynchronous communication by creating, editing, and managing help articles. Create your own help center that fits your brand.",
    cta: "Learn more on Bybelt Knowledge Base",
    href: marketingFeaturePath("/knowledge"),
    poster: "/images/marketing/features/knowledge-preview.webp",
    reverse: true,
  },
  {
    label: "Automations",
    title: "Craft tailor-made automated internal workflows",
    description:
      "Not ready for customer-facing AI agents? Bybelt lets you craft internal workflows to speed up teams' replies and reduce manual work through a no-code solution.",
    cta: "Learn more on the Bybelt AI Chatbot",
    href: marketingFeaturePath("/chatbot"),
    poster: "/images/marketing/agents/create-preview.webp",
    reverse: false,
  },
] as const;

export const FEATURES_OTHERS = [
  {
    label: "Chat Widget",
    title: "Instantly support leads and customers with a chat widget",
    description:
      "Add a chat widget to your website or Web app in minutes. From landing pages to native iOS, Android, or React apps, talk to visitors in real-time.",
    href: marketingFeaturePath("/livechat"),
    image: "/images/marketing/features-others/widget.png",
    icon: "/images/marketing/features-others/widget-blue.svg",
  },
  {
    label: "Support CRM",
    title: "Keep information about your customers in Bybelt's built-in CRM",
    description:
      "Synchronize leads and customer data in a single CRM. Whenever you communicate with someone, you have access to their data and past interactions.",
    href: marketingFeaturePath("/crm"),
    image: "/images/marketing/features-others/crm.png",
    icon: "/images/marketing/features-others/crm-blue.svg",
  },
  {
    label: "Artificial Intelligence",
    title: "AI that helps your teams and customers move faster",
    description:
      "Smart replies, auto-summaries, writing tools, and a support copilot trained on your content, and much more.",
    href: marketingFeaturePath("/artificial-intelligence"),
    image: "/images/agent/step_2.png",
    icon: "/images/marketing/features-others/ai-blue.svg",
  },
  {
    label: "Analytics",
    title: "See how efficient your customer support team is",
    description:
      "Get day-by-day metrics on how your support performs. Identify what you need to optimize to deliver a better service.",
    href: marketingFeaturePath("/analytics"),
    image: "/images/agent/step_4.png",
    icon: "/images/marketing/features-others/analytics-blue.svg",
  },
] as const;

export const USE_CASES = [
  {
    title: "Customer Support",
    description:
      "Cross-channel customer support experiences using modern messaging.",
    href: marketingFeaturePath("/shared-inbox"),
    image: "/images/marketing/usecases/customer-support.webp",
  },
  {
    title: "Inbound Sales",
    description:
      "Sell more by automating your sales pipeline using chatbots and AI workflows.",
    href: marketingFeaturePath("/livechat"),
    image: "/images/marketing/usecases/inbound-sales.webp",
  },
  {
    title: "Marketing",
    description:
      "Retarget customers by sending marketing emails and in-app messages.",
    href: marketingFeaturePath("/campaigns"),
    image: "/images/marketing/usecases/marketing.webp",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Bybelt has been amazing and the first thing that really attracted me to, as a techy, was the size of the chat widget.",
    author: "Emma",
  },
  {
    quote:
      "We chose Bybelt from the begining because of its flexibility and level of automations it allowed.",
    author: "Hoxton Mix",
  },
  {
    quote:
      "We really enjoy being able to play with the possibility of the api, so much that it has become a mini-backoffice for us.",
    author: "Beem Energy",
  },
  {
    quote: "Bybelt is probably one of my favorite part of my business. It's just so good.",
    author: "Publer",
  },
  {
    quote:
      "Bybelt has become a central asset for Reedsy, empowering the team to provide fast, personalized responses and make customer support more effective through AI-powered solutions.",
    author: "Reedsy",
  },
] as const;

export const FEATURES_DROPDOWN_LINKS = [
  { label: "Widget", href: marketingFeaturePath("/livechat") },
  { label: "AI Chatbot", href: marketingFeaturePath("/chatbot") },
  { label: "CRM", href: marketingFeaturePath("/crm") },
  { label: "Shared Inbox", href: marketingFeaturePath("/shared-inbox") },
  { label: "AI", href: marketingFeaturePath("/artificial-intelligence") },
  { label: "Campaigns", href: marketingFeaturePath("/campaigns") },
  { label: "Analytics", href: marketingFeaturePath("/analytics") },
  { label: "Knowledge", href: marketingFeaturePath("/knowledge") },
  { label: "Ticketing system", href: marketingFeaturePath("/ticket-center") },
  { label: "Status Page", href: marketingFeaturePath("/status-page") },
  { label: "Chat SDK", href: marketingFeaturePath("/chat-sdk") },
] as const;

export const MEGA_MENU_PROMOS = [
  {
    title: "Bybelt",
    description: "The one complete suite for AI-first customer support, including Hugo.",
    href: marketingFeaturePath("/"),
  },
  {
    title: "Hugo",
    description: "Your best AI support agent teammate.",
    href: marketingFeaturePath("/hugo"),
  },
] as const;

export const FEATURES_MEGA_MENU = [
  {
    label: "Widget",
    href: marketingFeaturePath("/livechat"),
    description: "Support from your website & mobile apps.",
    icon: "/images/marketing/features-others/widget-blue.svg",
  },
  {
    label: "AI Chatbot",
    href: marketingFeaturePath("/chatbot"),
    description: "Automate replies with a no-code chatbot builder.",
  },
  {
    label: "CRM",
    href: marketingFeaturePath("/crm"),
    description: "Organize your customer data in a CRM.",
    icon: "/images/marketing/features-others/crm-blue.svg",
  },
  {
    label: "Shared Inbox",
    href: marketingFeaturePath("/shared-inbox"),
    description: "Centralize your inbound communications.",
  },
  {
    label: "AI",
    href: marketingFeaturePath("/artificial-intelligence"),
    description: "Smart replies and a support copilot trained on your content.",
    icon: "/images/marketing/features-others/ai-blue.svg",
  },
  {
    label: "Campaigns",
    href: marketingFeaturePath("/campaigns"),
    description: "Build journeys that drive engagement.",
  },
  {
    label: "Analytics",
    href: marketingFeaturePath("/analytics"),
    description: "Monitor and track your teams' performances.",
    icon: "/images/marketing/features-others/analytics-blue.svg",
  },
  {
    label: "Knowledge",
    href: marketingFeaturePath("/knowledge"),
    description: "Make your customers more autonomous.",
  },
  {
    label: "Ticketing system",
    href: marketingFeaturePath("/ticket-center"),
    description: "Resolve issues without creating tickets.",
  },
  {
    label: "Status Page",
    href: marketingFeaturePath("/status-page"),
    description: "Keep customers informed during incidents.",
  },
  {
    label: "Chat SDK",
    href: marketingFeaturePath("/chat-sdk"),
    description: "Infrastructure and tools to empower developers.",
  },
] as const;

export const HELP_MEGA_MENU = [
  {
    label: "Help Center",
    href: PUBLIC_HELP_CENTER_URL,
    description: "Guides and tutorials for every feature.",
    external: true,
  },
  {
    label: "Bybelt Unleash",
    href: marketingFeaturePath("/unleash"),
    description: "Discover what's next for Bybelt.",
  },
  {
    label: "Developer Hub",
    href: PUBLIC_DOCS_URL,
    description: "REST API, webhooks, and SDK documentation.",
    external: true,
  },
] as const;

/** @deprecated Use HELP_MEGA_MENU — kept for simple label/href consumers */
export const HELP_DROPDOWN_LINKS = HELP_MEGA_MENU.map(({ label, href }) => ({
  label,
  href,
}));

export const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/bybelt" },
  { label: "X", href: "https://x.com/bybelt" },
  { label: "YouTube", href: "https://www.youtube.com/@bybelt" },
  { label: "Instagram", href: "https://www.instagram.com/bybelt/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/bybelt/" },
  { label: "GitHub", href: "https://github.com/bybelt" },
] as const;
