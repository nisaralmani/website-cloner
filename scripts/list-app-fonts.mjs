const res = await fetch("https://app.crisp.chat/initiate/login/");
const html = await res.text();
const fonts = [...new Set([...html.matchAll(/woff2[^"'\s]*/g)].map((m) => m[0]))];
console.log("woff2 refs:", fonts.slice(0, 20).join("\n"));
const cssLinks = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => m[1]);
console.log("\ncss:", cssLinks.slice(0, 5).join("\n"));
