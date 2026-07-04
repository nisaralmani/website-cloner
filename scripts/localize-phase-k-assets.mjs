import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://crisp.chat/_ipx/w_1400&f_png";

/** @type {{ url: string; dest: string }[]} */
const ASSETS = [
  {
    url: `${base}/components/shared-inbox/SharedInboxExplore/screenshot.webp`,
    dest: "public/images/marketing/shared-inbox/hero-screenshot.webp",
  },
  {
    url: `${base}/components/shared-inbox/SharedInboxShowcase/productivity.webp`,
    dest: "public/images/marketing/shared-inbox/showcase-productivity.webp",
  },
  {
    url: `${base}/components/shared-inbox/SharedInboxShowcase/customization.webp`,
    dest: "public/images/marketing/shared-inbox/showcase-customization.webp",
  },
  {
    url: `${base}/components/shared-inbox/SharedInboxShowcase/personalization.webp`,
    dest: "public/images/marketing/shared-inbox/showcase-personalization.webp",
  },
  {
    url: `${base}/components/shared-inbox/SharedInboxShowcase/time.webp`,
    dest: "public/images/marketing/shared-inbox/showcase-time.webp",
  },
  {
    url: `${base}/components/shared-inbox/SharedInboxCollaborate/autoassign.webp`,
    dest: "public/images/marketing/shared-inbox/collaborate-autoassign.webp",
  },
  {
    url: `${base}/components/shared-inbox/SharedInboxCollaborate/reminders.webp`,
    dest: "public/images/marketing/shared-inbox/collaborate-reminders.webp",
  },
  {
    url: `${base}/components/shared-inbox/SharedInboxCollaborate/private-notes.webp`,
    dest: "public/images/marketing/shared-inbox/collaborate-private-notes.webp",
  },
  {
    url: `${base}/components/shared-inbox/SharedInboxInboundMessages/illustration.webp`,
    dest: "public/images/marketing/shared-inbox/inbound-illustration.webp",
  },
  {
    url: `${base}/components/chatbot/ChatbotHeroScene/widget.webp`,
    dest: "public/images/marketing/chatbot/hero-widget.webp",
  },
  {
    url: `${base}/components/chatbot/ChatbotMainShowcase/information.webp`,
    dest: "public/images/marketing/chatbot/showcase-information.webp",
  },
  {
    url: `${base}/components/chatbot/ChatbotMainShowcase/handover.webp`,
    dest: "public/images/marketing/chatbot/showcase-handover.webp",
  },
  {
    url: `${base}/components/chatbot/ChatbotMainShowcase/ai.webp`,
    dest: "public/images/marketing/chatbot/showcase-ai.webp",
  },
  {
    url: `${base}/components/chatbot/ChatbotMainShowcase/flexibility.webp`,
    dest: "public/images/marketing/chatbot/showcase-flexibility.webp",
  },
  {
    url: `${base}/components/chatbot/ChatbotEngage/engagement.png`,
    dest: "public/images/marketing/chatbot/engage-engagement.png",
  },
  {
    url: `${base}/components/chatbot/ChatbotEngage/human.webp`,
    dest: "public/images/marketing/chatbot/engage-human.webp",
  },
  {
    url: `${base}/components/ai/AiTrainFeatures/website.webp`,
    dest: "public/images/marketing/chatbot/train-website.webp",
  },
  {
    url: "https://crisp.chat/_ipx/_/components/integrations/IntegrationsHero/illustration.svg",
    dest: "public/images/marketing/integrations/hero-illustration.svg",
  },
  {
    url: "https://crisp.chat/_ipx/s_96x96/components/apps/AppsHeroDownload/platform_macos.png",
    dest: "public/images/marketing/apps/platform-macos.png",
  },
  {
    url: "https://crisp.chat/_ipx/s_96x96/components/apps/AppsHeroDownload/platform_windows.png",
    dest: "public/images/marketing/apps/platform-windows.png",
  },
  {
    url: "https://crisp.chat/_ipx/s_96x96/components/apps/AppsHeroDownload/platform_ios.png",
    dest: "public/images/marketing/apps/platform-ios.png",
  },
  {
    url: "https://crisp.chat/_ipx/s_96x96/components/apps/AppsHeroDownload/platform_android.png",
    dest: "public/images/marketing/apps/platform-android.png",
  },
  {
    url: "https://crisp.chat/_ipx/s_96x96/components/apps/AppsHeroDownload/platform_web.png",
    dest: "public/images/marketing/apps/platform-web.png",
  },
];

async function download(url, dest) {
  const filePath = path.join(root, dest);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed ${response.status} ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return buffer.length;
}

let ok = 0;
for (const asset of ASSETS) {
  try {
    const bytes = await download(asset.url, asset.dest);
    console.log(`OK ${asset.dest} (${bytes} bytes)`);
    ok += 1;
  } catch (error) {
    console.warn(`SKIP ${asset.dest}: ${error instanceof Error ? error.message : error}`);
  }
}

console.log(`Downloaded ${ok}/${ASSETS.length} phase-k assets.`);
