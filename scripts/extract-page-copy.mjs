import fs from "node:fs";

const slug = process.argv[2];
const html = fs.readFileSync(`tmp-${slug}.html`, "utf8").replace(/&amp;/g, "&").replace(/&#39;/g, "'");

const blocks = [...html.matchAll(
  /<h[23][^>]*>[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?(?:<p[^>]*>([^<]+)<\/p>)?/g,
)];

for (const [, title, desc] of blocks) {
  if (title.length < 4 || title === "⌘K") continue;
  console.log("---");
  console.log(title.trim());
  if (desc) console.log(desc.trim());
}
