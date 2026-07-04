#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const REPLACEMENTS = [
  ["https://help.crisp.chat", "https://help.bybelt.com"],
  ["https://docs.crisp.chat", "https://docs.bybelt.com"],
  ["https://status.crisp.chat", "https://status.bybelt.com"],
  ["https://app.crisp.chat", "https://chat.bybelt.com"],
  ["https://crisp.chat", "https://bybelt.com"],
  ["help.crisp.chat", "help.bybelt.com"],
  ["docs.crisp.chat", "docs.bybelt.com"],
  ["app.crisp.chat", "chat.bybelt.com"],
  ["crisp.chat", "bybelt.com"],
  [".on.crisp.email", ".on.bybelt.com"],
  ["CRISP_CLONE_CHAT", "BYBELT_CHAT"],
  ["crisp.db", "bybelt.db"],
  ["/fonts/crisp/", "/fonts/bybelt/"],
  ["crisp-texture.png", "bybelt-texture.png"],
  ["crisp-logo.png", "bybelt-logo.png"],
  ["crisp-fonts.css", "bybelt-fonts.css"],
  ["templatesCrisp", "templatesBybelt"],
  ["CrispLogo", "BybeltLogo"],
  ["CrispMark", "BybeltMark"],
  ["crispIcons", "bybeltIcons"],
  ["Crisp Aeonik Pro", "Bybelt Aeonik Pro"],
  ["Crisp Inter", "Bybelt Inter"],
  ["Crisp Sans", "Bybelt Sans"],
  ["Crisp Templates", "Bybelt Templates"],
  ["Crisp Features", "Bybelt Features"],
  ["Crisp account", "Bybelt account"],
  ["Crisp plan", "Bybelt plan"],
  ["Crisp data", "Bybelt data"],
  ["Crisp Chatbox", "Bybelt Chatbox"],
  ["Crisp messages", "Bybelt messages"],
  ["Crisp Mini", "Bybelt Mini"],
  ["Crisp CDN", "Bybelt CDN"],
  ["Crisp/Hugo", "Bybelt/Hugo"],
  ["Crisp + Hugo", "Bybelt + Hugo"],
  ["Crisp logo", "Bybelt logo"],
  ["Crisp widget", "Bybelt widget"],
  ["Crisp SDK", "Bybelt SDK"],
  ["Crisp WebSocket", "Bybelt WebSocket"],
  ["Crisp UI clone", "Bybelt"],
  ["Crisp clone", "Bybelt"],
  ["| Crisp |", "| Bybelt |"],
  [" - Crisp", " - Bybelt"],
  ["Crisp Clone", "Bybelt"],
  ["Crisp", "Bybelt"],
  ["crisp:", "bybelt:"],
  [">crisp<", ">bybelt<"],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(md|mjs|ts|html|json|txt|yml|yaml)$/.test(name)) out.push(full);
  }
  return out;
}

let changed = 0;
const targets = [path.join(root, "docs")];
for (const extra of ["docs/CLONE_README.md", "tmp-signup.html"]) {
  const full = path.join(root, extra);
  if (existsSync(full)) targets.push(full);
}

for (const target of targets) {
  const files = statSync(target).isDirectory() ? walk(target) : [target];
  for (const file of files) {
    let text = readFileSync(file, "utf8");
    const before = text;
    for (const [from, to] of REPLACEMENTS) {
      text = text.split(from).join(to);
    }
    if (text !== before) {
      writeFileSync(file, text);
      changed++;
      console.log("updated", path.relative(root, file));
    }
  }
}

console.log(`\nDone. ${changed} files updated.`);
