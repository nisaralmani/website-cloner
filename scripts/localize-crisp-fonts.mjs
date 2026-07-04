import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "https://crisp.chat";

/** @type {{ url: string; dest: string }[]} */
const FONTS = [
  {
    url: `${base}/_crisp/aeonikpro_light.CxN-CIEw.woff2`,
    dest: "public/fonts/crisp/aeonikpro_light.woff2",
  },
  {
    url: `${base}/_crisp/aeonikpro_regular.CVLfaHXd.woff2`,
    dest: "public/fonts/crisp/aeonikpro_regular.woff2",
  },
  {
    url: `${base}/_crisp/aeonikpro_medium.NR6ee-b1.woff2`,
    dest: "public/fonts/crisp/aeonikpro_medium.woff2",
  },
  {
    url: `${base}/_crisp/aeonikpro_bold.DiukxAac.woff2`,
    dest: "public/fonts/crisp/aeonikpro_bold.woff2",
  },
  {
    url: `${base}/_crisp/inter_medium.DrI0ki-f.woff2`,
    dest: "public/fonts/crisp/inter_medium.woff2",
  },
  {
    url: `${base}/_crisp/inter_bold.CTICzzeq.woff2`,
    dest: "public/fonts/crisp/inter_bold.woff2",
  },
];

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
for (const font of FONTS) {
  try {
    const bytes = await download(font.url, font.dest);
    console.log(`OK ${font.dest} (${bytes}b)`);
    ok += 1;
  } catch (error) {
    console.warn(`SKIP ${font.dest}: ${error instanceof Error ? error.message : error}`);
  }
}
console.log(`Downloaded ${ok}/${FONTS.length} Crisp marketing fonts.`);
