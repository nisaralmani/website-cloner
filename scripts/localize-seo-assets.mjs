import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ url: string; dest: string }[]} */
const ASSETS = [
  {
    url: "https://crisp.chat/__og-image__/static/en/og.png",
    dest: "public/seo/og-en.png",
  },
  {
    url: "https://crisp.chat/favicon-512x512.png",
    dest: "public/seo/favicon-512x512.png",
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

console.log(`Downloaded ${ok}/${ASSETS.length} SEO assets (${failed} skipped).`);
