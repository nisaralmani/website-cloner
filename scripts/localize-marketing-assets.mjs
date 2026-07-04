import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ url: string; dest: string }[]} */
const ASSETS = [
  {
    url: "https://crisp.chat/_ipx/w_2800&f_png&q_90/components/home/HomeHeroApp/screenshot.png",
    dest: "public/images/marketing/hero-screenshot.png",
  },
  {
    url: "https://crisp.chat/_ipx/q_80/components/home/HomeHeroBackground/texture.webp",
    dest: "public/images/marketing/hero-texture.webp",
  },
  {
    url: "https://crisp.chat/_ipx/s_20x20/components/home/HomeHero/signup_arrow.svg",
    dest: "public/images/marketing/signup-arrow.svg",
  },
  {
    url: "https://crisp.chat/_ipx/s_36x36/components/home/HomeHeroApp/play_icon.svg",
    dest: "public/images/marketing/play-icon.svg",
  },
  {
    url: "https://crisp.chat/_ipx/s_59x18/common/icons/logo_hugo.svg",
    dest: "public/images/marketing/logo-hugo.svg",
  },
  {
    url: "https://crisp.chat/_ipx/h_36.8/components/home/HomeCustomers/logo_emma.svg",
    dest: "public/images/marketing/logos/emma.svg",
  },
  {
    url: "https://crisp.chat/_ipx/h_24/components/home/HomeCustomers/logo_airfrance.svg",
    dest: "public/images/marketing/logos/airfrance.svg",
  },
  {
    url: "https://crisp.chat/_ipx/h_32/components/home/HomeCustomers/logo_decathlon.svg",
    dest: "public/images/marketing/logos/decathlon.svg",
  },
  {
    url: "https://crisp.chat/_ipx/h_33.6/components/home/HomeCustomers/logo_refugiees.svg",
    dest: "public/images/marketing/logos/refugiees.svg",
  },
  {
    url: "https://crisp.chat/_ipx/h_36.8/components/home/HomeCustomers/logo_hotelbb.svg",
    dest: "public/images/marketing/logos/hotelbb.svg",
  },
  {
    url: "https://crisp.chat/_ipx/h_32/components/home/HomeCustomers/logo_reedsy.svg",
    dest: "public/images/marketing/logos/reedsy.svg",
  },
  {
    url: "https://crisp.chat/_ipx/h_32/components/home/HomeCustomers/logo_beemenergy.svg",
    dest: "public/images/marketing/logos/beemenergy.svg",
  },
  {
    url: "https://crisp.chat/_ipx/h_35.2/components/home/HomeCustomers/logo_thecompaniesapi.svg",
    dest: "public/images/marketing/logos/thecompaniesapi.svg",
  },
  {
    url: "https://crisp.chat/_ipx/h_24/components/home/HomeCustomers/logo_scribe.svg",
    dest: "public/images/marketing/logos/scribe.svg",
  },
  {
    url: "https://crisp.chat/_ipx/h_41.6/components/home/HomeCustomers/logo_publer.svg",
    dest: "public/images/marketing/logos/publer.svg",
  },
  {
    url: "https://storage.crisp.chat/public/videos/website/home/showcase/ai-preview.webp",
    dest: "public/images/marketing/platform/ai-preview.webp",
  },
  {
    url: "https://storage.crisp.chat/public/videos/website/home/agents/train-preview.webp",
    dest: "public/images/marketing/agents/train-preview.webp",
  },
  {
    url: "https://storage.crisp.chat/public/videos/website/home/agents/create-preview.webp",
    dest: "public/images/marketing/agents/create-preview.webp",
  },
  {
    url: "https://storage.crisp.chat/public/videos/website/home/agents/deploy-preview.webp",
    dest: "public/images/marketing/agents/deploy-preview.webp",
  },
  {
    url: "https://storage.crisp.chat/public/videos/website/home/agents/measure-preview.webp",
    dest: "public/images/marketing/agents/measure-preview.webp",
  },
  {
    url: "https://storage.crisp.chat/public/videos/website/home/features/inbox-preview.webp",
    dest: "public/images/marketing/features/inbox-preview.webp",
  },
  {
    url: "https://storage.crisp.chat/public/videos/website/home/features/knowledge-preview.webp",
    dest: "public/images/marketing/features/knowledge-preview.webp",
  },
  {
    url: "https://storage.crisp.chat/public/videos/website/home/features/ai-preview.webp",
    dest: "public/images/marketing/features/ai-preview.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_2800&f_png/components/home/HomeUsecases/customer_support.webp",
    dest: "public/images/marketing/usecases/customer-support.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_2800&f_png/components/home/HomeUsecases/inbound_sales.webp",
    dest: "public/images/marketing/usecases/inbound-sales.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_2800&f_png/components/home/HomeUsecases/marketing.webp",
    dest: "public/images/marketing/usecases/marketing.webp",
  },
  {
    url: "https://crisp.chat/_ipx/_/components/home/HomeFeaturesOthers/widget.png",
    dest: "public/images/marketing/features-others/widget.png",
  },
  {
    url: "https://crisp.chat/_ipx/_/components/home/HomeFeaturesOthers/crm.png",
    dest: "public/images/marketing/features-others/crm.png",
  },
  {
    url: "https://crisp.chat/_ipx/s_16x16/components/home/HomeFeaturesOthers/widget_blue.svg",
    dest: "public/images/marketing/features-others/widget-blue.svg",
  },
  {
    url: "https://crisp.chat/_ipx/s_16x16/components/home/HomeFeaturesOthers/crm_blue.svg",
    dest: "public/images/marketing/features-others/crm-blue.svg",
  },
  {
    url: "https://crisp.chat/_ipx/s_16x16/components/home/HomeFeaturesOthers/ai_blue.svg",
    dest: "public/images/marketing/features-others/ai-blue.svg",
  },
  {
    url: "https://crisp.chat/_ipx/s_16x16/components/home/HomeFeaturesOthers/analytics_blue.svg",
    dest: "public/images/marketing/features-others/analytics-blue.svg",
  },
  {
    url: "https://crisp.chat/_ipx/s_20x20/components/common/CommonFeatureVerticalShowcaseContainer/button_arrow.svg",
    dest: "public/images/marketing/button-arrow.svg",
  },
  {
    url: "https://crisp.chat/_ipx/q_90/components/common/CommonCrispHugoPortal/decor_crisp_texture.png",
    dest: "public/images/marketing/portal/crisp-texture.png",
  },
  {
    url: "https://crisp.chat/_ipx/_/components/common/CommonCrispHugoPortal/decor_crisp_logo.png",
    dest: "public/images/marketing/portal/crisp-logo.png",
  },
  {
    url: "https://crisp.chat/_ipx/q_90/components/common/CommonCrispHugoPortal/decor_hugo_texture.png",
    dest: "public/images/marketing/portal/hugo-texture.png",
  },
  {
    url: "https://crisp.chat/_ipx/_/components/common/CommonCrispHugoPortal/decor_hugo_logo.png",
    dest: "public/images/marketing/portal/hugo-logo.png",
  },
  {
    url: "https://crisp.chat/_ipx/s_18x18/components/common/CommonCrispHugoPortal/arrow_right_white.svg",
    dest: "public/images/marketing/portal/arrow-right-white.svg",
  },
  {
    url: "https://crisp.chat/_ipx/w_2800&f_png&q_75/components/common/CommonGenericCta/background.webp",
    dest: "public/images/marketing/cta/background.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_2800&f_png/components/common/CommonGenericCta/reception.webp",
    dest: "public/images/marketing/cta/reception.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_2800&f_png/components/common/CommonGenericCta/persona.webp",
    dest: "public/images/marketing/cta/persona.webp",
  },
];

async function download(url, dest) {
  const filePath = path.join(root, dest);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed ${response.status} ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return buffer.length;
}

let ok = 0;
let failed = 0;
for (const asset of ASSETS) {
  try {
    const bytes = await download(asset.url, asset.dest);
    console.log(`OK ${asset.dest} (${bytes} bytes)`);
    ok += 1;
  } catch (error) {
    failed += 1;
    console.warn(`SKIP ${asset.dest}: ${error instanceof Error ? error.message : error}`);
  }
}

console.log(`Downloaded ${ok}/${ASSETS.length} marketing assets (${failed} skipped).`);
