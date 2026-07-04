import fs from "node:fs";

const pages = [
  "signup",
  "integrations",
  "shared-inbox",
  "chatbot",
  "apps",
];

for (const slug of pages) {
  const url = `https://crisp.chat/en/${slug}/`;
  const res = await fetch(url);
  const html = await res.text();
  fs.writeFileSync(`tmp-${slug}.html`, html);
  const h1 = html.match(/<h1[^>]*>[\s\S]*?<span>([^<]+)<\/span>/);
  const sections = [...new Set(html.match(/class="[a-z-]*feature[a-z0-9_-]*"/gi) ?? [])].slice(0, 15);
  const imgs = [...new Set([...html.matchAll(/\/_ipx\/[^"'\s]+\.(?:webp|png|svg|jpg)/g)].map((m) => m[0]))].slice(0, 20);
  console.log(`\n=== ${slug} (${res.status}) ===`);
  console.log("h1:", h1?.[1] ?? "not found");
  console.log("images:", imgs.length);
  imgs.forEach((i) => console.log(" ", i));
}
