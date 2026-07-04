import fs from "node:fs";

const slug = process.argv[2] ?? "shared-inbox";
const html = fs.readFileSync(`tmp-${slug}.html`, "utf8");

const h1s = [...html.matchAll(/common-title[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)].map((m) =>
  m[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim(),
);
console.log("H1/H2 titles:", h1s.slice(0, 25));

const imgs = [
  ...new Set(
    [...html.matchAll(/\/_ipx\/[^"'\s]+\.(?:webp|png|svg|jpg)/g)].map((m) =>
      m[0].replace(/&amp;/g, "&"),
    ),
  ),
].filter((p) => p.includes(`/${slug}/`) || p.includes("Integrations") || p.includes("Apps"));

console.log("\nPage images:");
imgs.forEach((i) => console.log(i));

const paragraphs = [...html.matchAll(/<p[^>]*>([^<]{20,200})</g)]
  .map((m) => m[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'"))
  .filter((p) => !p.includes("cookie") && !p.includes("©"));
console.log("\nSample paragraphs:", paragraphs.slice(0, 12));
