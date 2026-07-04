#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const REPLACEMENTS = [
  ['href="/en/', 'href="/'],
  ["href='/en/", "href='/"],
  ['href="/en"', 'href="/"'],
  ["href='/en'", "href='/'"],
  ['href: "/en/', 'href: "/'],
  ['href: "/en"', 'href: "/"'],
  ['"/en#', '"/#'],
  ["https://bybelt.com/en/", "https://www.bybelt.com/"],
  ["https://help.bybelt.com/en/", "https://help.bybelt.com/"],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name === "node_modules" || name === ".next") continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(path.join(root, "src"))) {
  let text = readFileSync(file, "utf8");
  const before = text;
  for (const [from, to] of REPLACEMENTS) {
    text = text.split(from).join(to);
  }
  if (text !== before) {
    writeFileSync(file, text);
    changed++;
    console.log(path.relative(root, file));
  }
}

console.log(`\nDone. ${changed} files updated.`);
