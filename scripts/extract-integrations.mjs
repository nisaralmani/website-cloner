import fs from "node:fs";

const html = fs.readFileSync("tmp-integrations.html", "utf8");
const integrations = [...html.matchAll(
  /integrations-list-plugin__name[^>]*>([^<]+)<\/figcaption><figcaption[^>]*>([^<]+)</g,
)].map((m) => ({ name: m[1], summary: m[2] }));

console.log(JSON.stringify(integrations.slice(0, 24), null, 2));
console.error(`total: ${integrations.length}`);

const hero = html.match(/IntegrationsHero[^]{0,4000}/);
const h1 = html.match(/common-title--h1[^>]*>[\s\S]*?<span>([^<]+)<\/span>/);
console.error("h1:", h1?.[1]);
