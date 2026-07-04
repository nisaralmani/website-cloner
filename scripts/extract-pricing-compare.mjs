import fs from "node:fs";

const html = fs.readFileSync("tmp-pricing.html", "utf8");
const start = html.indexOf('class="pricing-compare"');
const end = html.indexOf('class="pricing-enterprise"', start);
const section = html.slice(start, end);
const tableStart = section.indexOf('class="common-table pricing-compare__table"');
const tableEnd = section.indexOf("</table>", tableStart);
const tableSection = section.slice(tableStart, tableEnd);

const categories = [];
let current = null;

for (const tbody of tableSection.matchAll(
  /<tbody[^>]*>([\s\S]*?)<\/tbody>/g,
)) {
  const body = tbody[1];
  const head = body.match(
    /common-table__tbody-head[^>]*>[\s\S]*?<\/svg>([^<]+)</,
  );
  if (!head) continue;
  const name = head[1].trim().replace(/&amp;/g, "&");
  current = { name, rows: [] };
  categories.push(current);

  for (const tr of body.matchAll(/<tr class="common-table__tr">([\s\S]*?)<\/tr>/g)) {
    const rowHtml = tr[1];
    if (rowHtml.includes("common-table__tbody-head")) continue;

    const labelMatch = rowHtml.match(
      /common-tooltip__wrapped[^>]*>[\s\S]*?<span>([^<]+)<\/span>/,
    );
    if (!labelMatch) continue;
    const label = labelMatch[1].trim();

    const cells = [...rowHtml.matchAll(/<td class="common-table__td">([\s\S]*?)<\/td>/g)];
    const values = cells.slice(1).map((cell) => {
      const c = cell[1];
      if (c.includes("icon-cross")) return false;
      if (c.includes("icon-check")) return true;
      const span = c.match(/<span>([^<]+)<\/span>/);
      return span ? span[1].trim() : null;
    });

    current.rows.push({ label, values });
  }
}

console.log(JSON.stringify(categories, null, 2));
console.error(`\n${categories.length} categories, ${categories.reduce((n, c) => n + c.rows.length, 0)} rows`);
