import fs from "node:fs";

const raw = fs.readFileSync("scripts/pricing-compare.json", "utf8");
const jsonStart = raw.indexOf("[");
const data = JSON.parse(raw.slice(jsonStart));

const out = `export type PricingCompareCell = string | boolean;

export type PricingCompareRow = {
  label: string;
  values: [PricingCompareCell, PricingCompareCell, PricingCompareCell, PricingCompareCell];
};

export type PricingCompareCategory = {
  name: string;
  rows: PricingCompareRow[];
};

export const PRICING_COMPARE_PLANS = ["Free", "Mini", "Essentials", "Plus"] as const;

export const PRICING_COMPARE_CATEGORIES: PricingCompareCategory[] = ${JSON.stringify(data, null, 2)} as PricingCompareCategory[];
`;

fs.writeFileSync("src/lib/marketing-pricing-compare.ts", out);
console.log("Wrote src/lib/marketing-pricing-compare.ts");
