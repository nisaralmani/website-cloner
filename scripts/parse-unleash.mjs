import fs from "node:fs";
const h = fs.readFileSync("tmp-unleash.html", "utf8").replace(/&amp;/g, "&");
const spans = [...h.matchAll(/<span>([^<]{8,120})<\/span>/g)].map((m) => m[1]).slice(0, 25);
console.log(spans.join("\n"));
