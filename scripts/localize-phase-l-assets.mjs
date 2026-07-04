import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://crisp.chat/_ipx/w_1400&f_png";

/** @type {{ url: string; dest: string }[]} */
const ASSETS = [
  ["crm", "components/crm/CrmHeroScene/screenshot.png", "hero.png"],
  ["crm", "components/crm/CrmShowcase/resolution.webp", "showcase-resolution.webp"],
  ["crm", "components/crm/CrmShowcase/source.webp", "showcase-source.webp"],
  ["crm", "components/crm/CrmShowcase/improve.webp", "showcase-improve.webp"],
  ["crm", "components/crm/CrmShowcase/personal.webp", "showcase-personal.webp"],
  ["crm", "components/crm/CrmExplore/illustration.webp", "explore.webp"],
  ["campaigns", "components/campaigns/CampaignsExplore/illustration.png", "hero.png"],
  ["campaigns", "components/campaigns/CampaignsShowcase/scale.webp", "showcase-scale.webp"],
  ["campaigns", "components/campaigns/CampaignsShowcase/setup.webp", "showcase-setup.webp"],
  ["campaigns", "components/campaigns/CampaignsShowcase/collaboration.webp", "showcase-collaboration.webp"],
  ["campaigns", "components/campaigns/CampaignsShowcase/omnichannel.webp", "showcase-omnichannel.webp"],
  ["analytics", "components/analytics/AnalyticsExplore/illustration.png", "hero.png"],
  ["analytics", "components/analytics/AnalyticsShowcase/performance.webp", "showcase-performance.webp"],
  ["analytics", "components/analytics/AnalyticsShowcase/measure.webp", "showcase-measure.webp"],
  ["analytics", "components/analytics/AnalyticsShowcase/dashboards.webp", "showcase-dashboards.webp"],
  ["analytics", "components/analytics/AnalyticsShowcase/show.webp", "showcase-show.webp"],
  ["knowledge", "components/knowledge/KnowledgeExplore/widget.png", "hero.png"],
  ["knowledge", "components/knowledge/KnowledgeShowcase/autonomous.webp", "showcase-autonomous.webp"],
  ["knowledge", "components/knowledge/KnowledgeShowcase/resolution.webp", "showcase-resolution.webp"],
  ["knowledge", "components/knowledge/KnowledgeShowcase/visibility.webp", "showcase-visibility.webp"],
  ["knowledge", "components/knowledge/KnowledgeShowcase/simple.webp", "showcase-simple.webp"],
  ["artificial-intelligence", "components/ai/AiHeroScene/inbox.png", "hero.png"],
  ["artificial-intelligence", "components/ai/AiHeroScene/builder.png", "showcase-builder.png"],
  ["artificial-intelligence", "components/ai/AiHeroScene/sources.png", "showcase-sources.png"],
  ["artificial-intelligence", "components/ai/AiHeroScene/chart.png", "showcase-chart.png"],
  ["artificial-intelligence", "components/ai/AiTrainFeatures/knowledge.webp", "showcase-knowledge.webp"],
  ["ticket-center", "components/ticket/TicketHeroScene/illustration.png", "hero.png"],
  ["ticket-center", "components/ticket/TicketShowcase/flexibility.webp", "showcase-flexibility.webp"],
  ["ticket-center", "components/ticket/TicketShowcase/ai.webp", "showcase-ai.webp"],
  ["ticket-center", "components/ticket/TicketShowcase/embed.webp", "showcase-embed.webp"],
  ["ticket-center", "components/ticket/TicketShowcase/resolution.webp", "showcase-resolution.webp"],
  ["status-page", "components/status/StatusHeroScene/screenshot.png", "hero.png"],
  ["status-page", "components/status/StatusShowcase/faith.webp", "showcase-faith.webp"],
  ["status-page", "components/status/StatusShowcase/confidence.webp", "showcase-confidence.webp"],
  ["status-page", "components/status/StatusShowcase/customize.webp", "showcase-customize.webp"],
  ["status-page", "components/status/StatusShowcase/no_surprise.webp", "showcase-no-surprise.webp"],
  ["chat-sdk", "components/sdk/SdkHeroBackground/widget.png", "hero.png"],
  ["chat-sdk", "components/sdk/SdkShowcase/customize.webp", "showcase-customize.webp"],
  ["chat-sdk", "components/sdk/SdkShowcase/omnichannel.webp", "showcase-omnichannel.webp"],
  ["chat-sdk", "components/sdk/SdkShowcase/automation.webp", "showcase-automation.webp"],
  ["chat-sdk", "components/sdk/SdkShowcase/lightweight.webp", "showcase-lightweight.webp"],
  ["unleash", "components/unleash/UnleashHero/illustration.webp", "hero.webp"],
].map(([folder, component, file]) => ({
  url: `${base}/${component}`,
  dest: `public/images/marketing/${folder}/${file}`,
}));

async function download(url, dest) {
  const filePath = path.join(root, dest);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return buffer.length;
}

let ok = 0;
for (const asset of ASSETS) {
  try {
    const bytes = await download(asset.url, asset.dest);
    console.log(`OK ${asset.dest} (${bytes}b)`);
    ok += 1;
  } catch (error) {
    console.warn(`SKIP ${asset.dest}: ${error instanceof Error ? error.message : error}`);
  }
}
console.log(`Downloaded ${ok}/${ASSETS.length}`);
