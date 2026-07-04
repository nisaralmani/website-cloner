#!/usr/bin/env node
/**
 * One-shot rebrand: Crisp → Bybelt in src/, public/, and smoke scripts.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, renameSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const REPLACEMENTS = [
  ["https://help.crisp.chat", "https://help.bybelt.com"],
  ["https://docs.crisp.chat", "https://docs.bybelt.com"],
  ["https://status.crisp.chat", "https://status.bybelt.com"],
  ["https://crisp.chat", "https://bybelt.com"],
  [".on.crisp.email", ".on.bybelt.com"],
  ["crisp-clone-webhooks", "bybelt-webhooks"],
  ["crisp-clone-chatbox", "bybelt-chatbox"],
  ["crisp-clone:", "bybelt:"],
  ["crisp-clone-", "bybelt-"],
  ["crisp_session", "bybelt_session"],
  ["crisp-features", "bybelt-features"],
  ["templatesCrisp", "templatesBybelt"],
  ["/campaigns/templates/crisp", "/campaigns/templates/bybelt"],
  ['category: "crisp"', 'category: "bybelt"'],
  ['category === "crisp"', 'category === "bybelt"'],
  [': "crisp"', ': "bybelt"'],
  ['| "crisp" |', '| "bybelt" |'],
  ['"crisp" | "yours"', '"bybelt" | "yours"'],
  ["CrispLogo", "BybeltLogo"],
  ["CrispMark", "BybeltMark"],
  ["crispIcons", "bybeltIcons"],
  ["crisp-marketing", "bybelt-marketing"],
  ["crisp-fonts.css", "bybelt-fonts.css"],
  ['>crisp<', ">bybelt<"],
  ["Crisp Aeonik Pro", "Bybelt Aeonik Pro"],
  ["Crisp Inter", "Bybelt Inter"],
  ["Crisp IM SAS", "Bybelt"],
  ["Crisp clone", "Bybelt"],
  ["Crisp Clone", "Bybelt"],
  ["Crisp", "Bybelt"],
  // wordmark in logo span (after Crisp -> Bybelt may have missed lowercase)
  [">bybelt<", ">bybelt<"], // noop placeholder
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function shouldProcess(file) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  if (rel.startsWith("docs/research")) return false;
  if (rel.startsWith("docs/superpowers")) return false;
  if (rel.startsWith("scripts/localize-")) return false;
  if (rel.startsWith("scripts/download-crisp")) return false;
  if (rel.startsWith("scripts/list-crisp")) return false;
  if (rel.startsWith("scripts/list-app-fonts")) return false;
  if (rel.startsWith("scripts/probe-")) return false;
  if (rel.startsWith("scripts/fetch-hugo")) return false;
  if (rel.startsWith("scripts/extract-")) return false;
  if (rel.endsWith("rebrand-crisp-to-bybelt.mjs")) return false;
  if (rel.startsWith("src/") && /\.(ts|tsx|css)$/.test(rel)) return true;
  if (rel.startsWith("public/") && /\.(json|webmanifest|xml|txt)$/.test(rel)) return true;
  if (
    rel === "scripts/smoke-routes.mjs" ||
    rel === "scripts/smoke-api-tests.mjs" ||
    rel === "scripts/verify-production.mjs" ||
    rel === "scripts/live-qa-marketing.mjs"
  ) {
    return true;
  }
  return false;
}

let changed = 0;
for (const file of walk(root)) {
  if (!shouldProcess(file)) continue;
  let text = readFileSync(file, "utf8");
  const before = text;
  for (const [from, to] of REPLACEMENTS) {
    if (from === ">bybelt<") continue;
    text = text.split(from).join(to);
  }
  // Fix logo wordmark if still lowercase crisp in icons
  if (file.endsWith("icons.tsx")) {
    text = text.replace(/>\s*crisp\s*</, ">bybelt<");
  }
  if (text !== before) {
    writeFileSync(file, text);
    changed++;
    console.log("updated", path.relative(root, file));
  }
}

const fontsOld = path.join(root, "src/app/crisp-fonts.css");
const fontsNew = path.join(root, "src/app/bybelt-fonts.css");
if (existsSync(fontsOld) && !existsSync(fontsNew)) {
  renameSync(fontsOld, fontsNew);
  console.log("renamed crisp-fonts.css -> bybelt-fonts.css");
} else if (existsSync(fontsOld)) {
  renameSync(fontsOld, fontsNew);
}

console.log(`\nDone. ${changed} files updated.`);
