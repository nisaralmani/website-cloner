import fs from "node:fs";

const html = fs.readFileSync("tmp-pricing.html", "utf8");

const bodyIdx = html.indexOf('class="pricing-compare"');
if (bodyIdx >= 0) {
  console.log(html.slice(bodyIdx, bodyIdx + 15000));
}

const rows = [...html.matchAll(/pricing-compare-row[^"]*|compare-row[^"]*/g)].slice(0, 20);
console.log("row classes", rows.map((r) => r[0]));
