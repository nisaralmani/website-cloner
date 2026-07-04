const response = await fetch("https://crisp.chat/en/", {
  headers: { "User-Agent": "Mozilla/5.0" },
});
const html = await response.text();
const assets = [
  ...new Set(
    [...html.matchAll(/\/_ipx\/[^"'\s>]+/g)]
      .map((m) => m[0].replace(/&amp;/g, "&"))
      .filter((u) => /hugo|Hugo|agent/i.test(u)),
  ),
];
console.log(assets.slice(0, 30).join("\n"));
