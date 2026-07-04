import fs from "node:fs";
const h = fs.readFileSync("tmp-chat-sdk.html", "utf8").replace(/&amp;/g, "&");
const u = [
  ...new Set(
    [...h.matchAll(/\/_ipx\/w_1400&f_(?:png|webp)\/components\/sdk\/[^"'\s]+/g)].map(
      (m) => m[0],
    ),
  ),
];
console.log(u.join("\n"));
