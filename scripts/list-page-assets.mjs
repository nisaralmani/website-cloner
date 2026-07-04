import fs from "node:fs";

const slug = process.argv[2];
const html = fs.readFileSync(`tmp-${slug}.html`, "utf8").replace(/&amp;/g, "&");

const unique = [
  ...new Set(
    [...html.matchAll(/\/_ipx\/w_1400&f_png\/([^"'\s]+)/g)].map((m) => m[1]),
  ),
];
console.log(unique.join("\n"));

const uniqueWebp = [
  ...new Set(
    [...html.matchAll(/\/_ipx\/w_1400&f_webp\/([^"'\s]+)/g)].map((m) => m[1]),
  ),
];
console.log("\nwebp:");
console.log(uniqueWebp.join("\n"));

const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
console.error("\ntitle:", title);
