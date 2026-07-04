import fs from "node:fs";

const slug = process.argv[2];
const html = fs.readFileSync(`tmp-${slug}.html`, "utf8").replace(/&amp;/g, "&").replace(/&#39;/g, "'");

const titles = [...html.matchAll(/common-title[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)]
  .map((m) => m[1].trim())
  .filter((t) => t.length > 3 && t !== "⌘K");

console.log("SECTIONS:");
for (const t of titles.slice(0, 20)) console.log("-", t);
