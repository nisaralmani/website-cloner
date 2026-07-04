import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ url: string; dest: string }[]} */
const ASSETS = [
  {
    url: "https://crisp.chat/_ipx/w_1400&f_png/components/widget/WidgetHeroScene/widget.webp",
    dest: "public/images/marketing/livechat/hero-widget.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_1400&f_png/components/widget/WidgetMainShowcase/satisfaction.webp",
    dest: "public/images/marketing/livechat/showcase-satisfaction.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_1400&f_png/components/widget/WidgetMainShowcase/engagement.webp",
    dest: "public/images/marketing/livechat/showcase-engagement.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_1400&f_png/components/widget/WidgetMainShowcase/human.webp",
    dest: "public/images/marketing/livechat/showcase-human.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_1400&f_png/components/widget/WidgetMainShowcase/continuity.webp",
    dest: "public/images/marketing/livechat/showcase-continuity.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_1400&f_png/components/widget/WidgetCustomizationShowcase/colors.webp",
    dest: "public/images/marketing/livechat/customize-colors.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_1400&f_png/components/widget/WidgetCustomizationShowcase/texts.webp",
    dest: "public/images/marketing/livechat/customize-texts.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_1400&f_png/components/widget/WidgetCustomizationShowcase/locations.webp",
    dest: "public/images/marketing/livechat/customize-locations.webp",
  },
  {
    url: "https://crisp.chat/_ipx/w_1400&f_png/components/widget/WidgetCustomizationShowcase/help.webp",
    dest: "public/images/marketing/livechat/customize-help.webp",
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

console.log(`Downloaded ${ok}/${ASSETS.length} livechat assets.`);
