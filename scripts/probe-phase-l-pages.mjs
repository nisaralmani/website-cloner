import fs from "node:fs";

const fetches = [
  ["crm", "crm"],
  ["campaigns", "campaigns"],
  ["analytics", "analytics"],
  ["knowledge", "knowledge"],
  ["unleash", "unleash"],
  ["artificial-intelligence", "ai"],
  ["ticket-center", "ticket"],
  ["status-page", "status"],
  ["chat-sdk", "sdk"],
];

for (const [slug, liveSlug] of fetches) {
  const url = `https://crisp.chat/en/${liveSlug}/`;
  const res = await fetch(url);
  const html = await res.text();
  fs.writeFileSync(`tmp-${slug}.html`, html);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/&amp;/g, "&");
  const h1 = html.match(/common-title--h1[\s\S]{0,400}?<span>([^<]+)<\/span>/)?.[1]?.replace(/&amp;/g, "&");
  const assets = [
    ...new Set(
      [...html.replace(/&amp;/g, "&").matchAll(/\/_ipx\/w_1400&f_(?:png|webp)\/([^"'\s]+)/g)].map(
        (m) => m[1],
      ),
    ),
  ].filter((p) => !p.includes("CommonGenericCta"));
  console.log(`\n=== ${slug} <- ${liveSlug} (${res.status}) ===`);
  console.log("title:", title);
  console.log("h1:", h1);
  console.log("assets:", assets.slice(0, 8).join("\n  "));
}
