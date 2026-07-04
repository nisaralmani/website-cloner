import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "seo");
const assets = [
  "https://app.crisp.chat/favicons/favicon.ico",
  "https://app.crisp.chat/favicons/favicon-32x32.png",
  "https://app.crisp.chat/favicons/apple-touch-icon.png",
];

fs.mkdirSync(outDir, { recursive: true });

for (const url of assets) {
  const name = path.basename(new URL(url).pathname);
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`skip ${url}: ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`saved ${name}`);
}
