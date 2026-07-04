const res = await fetch("https://crisp.chat/en/");
const html = await res.text();
const fonts = [
  ...new Set([...html.matchAll(/\/_crisp\/[^"'\s]+\.woff2/g)].map((m) => m[0])),
];
console.log(fonts.join("\n"));
