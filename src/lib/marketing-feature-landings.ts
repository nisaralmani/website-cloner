export type FeatureShowcaseItem = {
  id: string;
  title: string;
  description: string;
  image: string;
};

export type FeatureHighlight = {
  title: string;
  description: string;
};

export type FeatureLandingConfig = {
  eyebrow: string;
  heroImage: string;
  heroImageAlt: string;
  showcaseTitle: string;
  showcase: FeatureShowcaseItem[];
  highlights: FeatureHighlight[];
  pills?: readonly string[];
};

export type FeatureLandingSlug =
  | "crm"
  | "campaigns"
  | "analytics"
  | "knowledge"
  | "artificial-intelligence"
  | "ticket-center"
  | "status-page"
  | "chat-sdk"
  | "unleash";

const img = (folder: string, file: string) =>
  `/images/marketing/${folder}/${file}`;

export const FEATURE_LANDING_CONFIG: Record<FeatureLandingSlug, FeatureLandingConfig> = {
  crm: {
    eyebrow: "CRM",
    heroImage: img("crm", "hero.png"),
    heroImageAlt: "Bybelt CRM customer profile view",
    showcaseTitle: "Extensible customer data management, at your fingertips",
    showcase: [
      {
        id: "resolution",
        title: "No matter the data source, Bybelt makes it easy to create a unified view",
        description:
          "Sync customer data from your website, email, and integrations into one profile with full conversation history.",
        image: img("crm", "showcase-resolution.webp"),
      },
      {
        id: "source",
        title: "Standardized data that makes the dream work",
        description:
          "Organize contacts with custom fields, segments, and tags your whole team can rely on.",
        image: img("crm", "showcase-source.webp"),
      },
      {
        id: "improve",
        title: "All that matters, is a delightful customer experience",
        description:
          "Give agents the context they need to personalize every reply without switching tools.",
        image: img("crm", "showcase-improve.webp"),
      },
      {
        id: "personal",
        title: "Personalize each conversation, no matter the channel",
        description:
          "See purchase history, plan tier, and past tickets beside every inbound message.",
        image: img("crm", "showcase-personal.webp"),
      },
    ],
    highlights: [
      {
        title: "Unified customer profiles",
        description: "One record per customer across chat, email, and messaging channels.",
      },
      {
        title: "Custom data fields",
        description: "Capture the attributes that matter to your business and segment audiences.",
      },
      {
        title: "Conversation history",
        description: "Every touchpoint stored alongside CRM data for full context.",
      },
    ],
  },
  campaigns: {
    eyebrow: "Campaigns",
    heroImage: img("campaigns", "hero.png"),
    heroImageAlt: "Bybelt customer engagement campaigns",
    showcaseTitle: "Craft customers' journeys that just feel right",
    showcase: [
      {
        id: "scale",
        title: "Build a solid foundation of customer data",
        description:
          "Use your CRM segments to target the right users with email and in-app campaigns.",
        image: img("campaigns", "showcase-scale.webp"),
      },
      {
        id: "setup",
        title: "Supercharge your communication with customizable sequences",
        description:
          "Design multi-step journeys that nurture leads and re-engage inactive customers.",
        image: img("campaigns", "showcase-setup.webp"),
      },
      {
        id: "collaboration",
        title: "Turn up the fun in customer interactions",
        description:
          "Collaborate on campaign copy and timing with your marketing and support teams.",
        image: img("campaigns", "showcase-collaboration.webp"),
      },
      {
        id: "omnichannel",
        title: "Craft the most compelling messages, on multiple channels",
        description:
          "Reach customers on email, chat, and messaging apps from one campaign builder.",
        image: img("campaigns", "showcase-omnichannel.webp"),
      },
    ],
    highlights: [
      {
        title: "Journey builder",
        description: "Composable workflows for onboarding, upsell, and win-back sequences.",
      },
      {
        title: "Campaign analytics",
        description: "Understand what drives engagement and optimize every send.",
      },
      {
        title: "Omnichannel delivery",
        description: "Coordinate messages across channels without duplicate outreach.",
      },
    ],
  },
  analytics: {
    eyebrow: "Analytics",
    heroImage: img("analytics", "hero.png"),
    heroImageAlt: "Bybelt support analytics dashboards",
    showcaseTitle: "Working smarter starts with seeing clearer",
    showcase: [
      {
        id: "performance",
        title: "Service quality shouldn't be a guess",
        description:
          "Track response times, resolution rates, and CSAT to spot bottlenecks before customers churn.",
        image: img("analytics", "showcase-performance.webp"),
      },
      {
        id: "measure",
        title: "Visualize your data, your way",
        description:
          "Build dashboards that surface the KPIs your leadership team actually cares about.",
        image: img("analytics", "showcase-measure.webp"),
      },
      {
        id: "dashboards",
        title: "Give teams reportings they need to own their impact",
        description:
          "Share views by team, channel, or agent so everyone knows where to improve.",
        image: img("analytics", "showcase-dashboards.webp"),
      },
      {
        id: "show",
        title: "Export any dashboard, and share the story behind the numbers",
        description:
          "Export reports and align product, support, and success on the same metrics.",
        image: img("analytics", "showcase-show.webp"),
      },
    ],
    highlights: [
      {
        title: "Real-time metrics",
        description: "Monitor inbox volume, first response time, and satisfaction live.",
      },
      {
        title: "Custom dashboards",
        description: "Arrange charts and filters to match your operating model.",
      },
      {
        title: "Team performance",
        description: "Compare agents and queues fairly with normalized reporting.",
      },
    ],
  },
  knowledge: {
    eyebrow: "Knowledge Base",
    heroImage: img("knowledge", "hero.png"),
    heroImageAlt: "Bybelt knowledge base widget",
    showcaseTitle: "Help articles that finally get read",
    showcase: [
      {
        id: "autonomous",
        title: "Let your customers help themselves",
        description:
          "Publish a branded help center that deflects tickets before they reach your inbox.",
        image: img("knowledge", "showcase-autonomous.webp"),
      },
      {
        id: "resolution",
        title: "Spread help content the most effective way",
        description:
          "Surface articles in your chat widget, email signatures, and Hugo AI answers.",
        image: img("knowledge", "showcase-resolution.webp"),
      },
      {
        id: "visibility",
        title: "AI-guided answers that get resolved in a breeze",
        description:
          "Hugo suggests the right article at the right moment during live conversations.",
        image: img("knowledge", "showcase-visibility.webp"),
      },
      {
        id: "simple",
        title: "Knowledge that vibes with your brand identity",
        description:
          "Customize colors, domains, and article layout to match your product experience.",
        image: img("knowledge", "showcase-simple.webp"),
      },
    ],
    highlights: [
      {
        title: "Multilingual articles",
        description: "Publish help content in every language your customers speak.",
      },
      {
        title: "Widget integration",
        description: "Embed search and suggested articles directly in the chat widget.",
      },
      {
        title: "Article analytics",
        description: "See which articles resolve issues and which need improvement.",
      },
    ],
  },
  "artificial-intelligence": {
    eyebrow: "Artificial Intelligence",
    heroImage: img("artificial-intelligence", "hero.png"),
    heroImageAlt: "Bybelt AI assistant in the inbox",
    showcaseTitle: "Cutting edge artificial intelligence for support teams",
    showcase: [
      {
        id: "builder",
        title: "A virtual assistant that speaks and sounds like you do",
        description:
          "Smart replies, summaries, and writing tools trained on your content and tone.",
        image: img("artificial-intelligence", "showcase-builder.png"),
      },
      {
        id: "sources",
        title: "Step into the era of augmented customer experience",
        description:
          "Pull answers from your website, knowledge base, and past conversations automatically.",
        image: img("artificial-intelligence", "showcase-sources.png"),
      },
      {
        id: "chart",
        title: "Measure AI quality at every step of the journey",
        description:
          "Track automation rates, handoff quality, and customer satisfaction for AI-assisted replies.",
        image: img("artificial-intelligence", "showcase-chart.png"),
      },
      {
        id: "knowledge",
        title: "Free up more time with AI Agents",
        description:
          "Combine inbox copilot features with Hugo workflows for end-to-end automation.",
        image: img("artificial-intelligence", "showcase-knowledge.webp"),
      },
    ],
    highlights: [
      {
        title: "Smart replies",
        description: "Draft accurate responses agents can send in one click.",
      },
      {
        title: "Auto-summaries",
        description: "Catch up on long threads instantly with AI-generated summaries.",
      },
      {
        title: "Support copilot",
        description: "Translate, rephrase, and expand messages without leaving the inbox.",
      },
    ],
    pills: ["Smart replies", "Summaries", "Translation", "Hugo AI", "Workflow builder"],
  },
  "ticket-center": {
    eyebrow: "Ticketing",
    heroImage: img("ticket-center", "hero.png"),
    heroImageAlt: "Bybelt help desk ticketing",
    showcaseTitle: "Made to change your customer support management strategy",
    showcase: [
      {
        id: "flexibility",
        title: "A help desk platform for all your customers' requests",
        description:
          "Turn any conversation into a ticket and track complex issues to resolution.",
        image: img("ticket-center", "showcase-flexibility.webp"),
      },
      {
        id: "ai",
        title: "Let artificial intelligence handle your repetitive work",
        description:
          "Auto-categorize, summarize, and route tickets so agents focus on high-impact cases.",
        image: img("ticket-center", "showcase-ai.webp"),
      },
      {
        id: "embed",
        title: "Dedicated workspaces for each team to improve ownership",
        description:
          "Assign tickets by team, priority, and SLA without leaving the shared inbox.",
        image: img("ticket-center", "showcase-embed.webp"),
      },
      {
        id: "resolution",
        title: "Make customer support experiences consistent and scalable",
        description:
          "Standardize workflows so every customer gets the same quality of service.",
        image: img("ticket-center", "showcase-resolution.webp"),
      },
    ],
    highlights: [
      {
        title: "Ticket workflows",
        description: "Statuses, priorities, and assignments built into your inbox.",
      },
      {
        title: "SLA tracking",
        description: "Monitor deadlines and escalations before customers notice delays.",
      },
      {
        title: "Collision prevention",
        description: "See who is working on a ticket and avoid duplicate effort.",
      },
    ],
  },
  "status-page": {
    eyebrow: "Status Page",
    heroImage: img("status-page", "hero.png"),
    heroImageAlt: "Bybelt public status page",
    showcaseTitle: "Everything you need to get started with incident management",
    showcase: [
      {
        id: "faith",
        title: "Proactive communication that prevents support flooding",
        description:
          "Publish incidents before your inbox fills with “is it down?” messages.",
        image: img("status-page", "showcase-faith.webp"),
      },
      {
        id: "confidence",
        title: "Keep your customers in the loop",
        description:
          "Share real-time updates from investigation through resolution on a branded page.",
        image: img("status-page", "showcase-confidence.webp"),
      },
      {
        id: "customize",
        title: "Status pages you can make your own",
        description:
          "Match your brand colors, domain, and component layout in minutes.",
        image: img("status-page", "showcase-customize.webp"),
      },
      {
        id: "no-surprise",
        title: "From total outage to resolved — with full transparency",
        description:
          "Maintain trust with clear timelines and post-incident summaries.",
        image: img("status-page", "showcase-no-surprise.webp"),
      },
    ],
    highlights: [
      {
        title: "Incident timeline",
        description: "Post updates as your team investigates and fixes issues.",
      },
      {
        title: "Uptime monitoring",
        description: "Show historical availability for every service component.",
      },
      {
        title: "Subscriber alerts",
        description: "Let customers subscribe to email notifications for incidents.",
      },
    ],
  },
  "chat-sdk": {
    eyebrow: "Chat SDK",
    heroImage: img("chat-sdk", "hero.png"),
    heroImageAlt: "Bybelt Chat SDK for mobile and web",
    showcaseTitle: "Improve in-app messaging in just days, not weeks",
    showcase: [
      {
        id: "mobile",
        title: "Built alongside a chat API that handles 230M monthly users",
        description:
          "Drop a battle-tested SDK into iOS, Android, React, and JavaScript apps.",
        image: img("chat-sdk", "showcase-mobile.webp"),
      },
      {
        id: "developer",
        title: "Send messages that just feel right",
        description:
          "Rich message types, typing indicators, and read receipts out of the box.",
        image: img("chat-sdk", "showcase-developer.webp"),
      },
      {
        id: "prebuilt",
        title: "Give your teams and customers the answers they deserve",
        description:
          "Connect the SDK to your knowledge base and Hugo AI for in-app self-service.",
        image: img("chat-sdk", "showcase-prebuilt.webp"),
      },
      {
        id: "human",
        title: "Automation and chatbots that never let you down",
        description:
          "Hand off from bot to human agent without breaking the in-app experience.",
        image: img("chat-sdk", "showcase-human.webp"),
      },
    ],
    highlights: [
      {
        title: "iOS & Android SDKs",
        description: "Native SDKs with push notifications and offline support.",
      },
      {
        title: "React & JavaScript",
        description: "Embed chat in web apps and SPAs with lightweight bundles.",
      },
      {
        title: "Developer API",
        description: "Full REST and RTM APIs for custom integrations and workflows.",
      },
    ],
    pills: ["iOS", "Android", "React Native", "JavaScript", "REST API"],
  },
  unleash: {
    eyebrow: "Unleash",
    heroImage: img("unleash", "hero.webp"),
    heroImageAlt: "Bybelt Unleash product updates",
    showcaseTitle: "Discover what's next for Bybelt",
    showcase: [],
    highlights: [
      {
        title: "Product updates",
        description:
          "Follow every release, improvement, and fix as we ship new capabilities.",
      },
      {
        title: "Beta programs",
        description:
          "Get early access to AI features, inbox experiments, and partner integrations.",
      },
      {
        title: "Public roadmap",
        description:
          "See what we are building next and vote on the features that matter to your team.",
      },
      {
        title: "Changelog",
        description:
          "Browse a detailed history of changes across the Bybelt platform.",
      },
    ],
    pills: ["Roadmap", "Beta access", "Changelog", "Feature votes"],
  },
};

export const FEATURE_LANDING_SLUGS = Object.keys(
  FEATURE_LANDING_CONFIG,
) as FeatureLandingSlug[];

export function isFeatureLandingSlug(slug: string): slug is FeatureLandingSlug {
  return slug in FEATURE_LANDING_CONFIG;
}
