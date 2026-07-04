#!/usr/bin/env node

/**
 * Critical authenticated API journeys (no browser).
 * Requires seeded DB + running Next server without SMOKE_BYPASS_AUTH.
 *
 * Usage:
 *   E2E_BASE_URL=http://127.0.0.1:3099 node scripts/e2e-critical.mjs
 */

const base = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:3099").replace(/\/$/, "");
const email = process.env.E2E_LOGIN_EMAIL ?? "contact@fashionpara.com";
const password = process.env.E2E_LOGIN_PASSWORD ?? process.env.SEED_USER_PASSWORD ?? "fashionsis-dev";

function parseSetCookie(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function mergeCookies(jar, response) {
  const next = new Map(jar);
  for (const raw of parseSetCookie(response)) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (!value) next.delete(name);
    else next.set(name, value);
  }
  return next;
}

async function assertStatus(label, response, expected) {
  if (response.status !== expected) {
    const body = await response.text().catch(() => "");
    throw new Error(`${label}: expected ${expected}, got ${response.status} — ${body.slice(0, 200)}`);
  }
}

const checks = [];

async function run() {
  const jar = new Map();

  checks.push("protected route redirects without session");
  const protectedRes = await fetch(`${base}/settings`, { redirect: "manual" });
  if (protectedRes.status !== 307 && protectedRes.status !== 302) {
    throw new Error(`Protected route: expected redirect, got ${protectedRes.status}`);
  }
  const location = protectedRes.headers.get("location") ?? "";
  if (!location.includes("/initiate/login")) {
    throw new Error(`Protected route: expected login redirect, got ${location}`);
  }

  checks.push("login API");
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, remember: true }),
  });
  await assertStatus("login API", loginRes, 200);
  const jarAfterLogin = mergeCookies(jar, loginRes);

  checks.push("session API returns seeded workspace");
  const sessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: cookieHeader(jarAfterLogin) },
  });
  await assertStatus("session API", sessionRes, 200);
  const session = await sessionRes.json();
  if (!session.authenticated || !session.workspace?.name) {
    throw new Error("session API: expected authenticated workspace");
  }
  if (session.workspace.domain !== "fashionsis.com") {
    throw new Error(`session API: unexpected workspace domain ${session.workspace.domain}`);
  }

  checks.push("analytics API returns real workspace payload");
  const analyticsRes = await fetch(`${base}/api/analytics?days=7`, {
    headers: { Cookie: cookieHeader(jarAfterLogin) },
  });
  await assertStatus("analytics API", analyticsRes, 200);
  const analytics = await analyticsRes.json();
  if (typeof analytics.analyticsEnabled !== "boolean") {
    throw new Error("analytics API: missing analyticsEnabled field");
  }
  if (!analytics.timezone) {
    throw new Error("analytics API: missing timezone");
  }

  checks.push("workspace profile API");
  const profileRes = await fetch(`${base}/api/workspaces/profile`, {
    headers: { Cookie: cookieHeader(jarAfterLogin) },
  });
  await assertStatus("workspace profile API", profileRes, 200);
  const profile = await profileRes.json();
  const domain = profile.profile?.domain ?? profile.workspace?.domain;
  if (domain !== "fashionsis.com") {
    throw new Error(`workspace profile: unexpected domain ${domain}`);
  }

  checks.push("Shopify integration status API");
  const shopifyRes = await fetch(`${base}/api/integrations/shopify/status`, {
    headers: { Cookie: cookieHeader(jarAfterLogin) },
  });
  await assertStatus("shopify status API", shopifyRes, 200);
  const shopify = await shopifyRes.json();
  if (typeof shopify.linked !== "boolean") {
    throw new Error("shopify status API: missing linked field");
  }

  for (const name of checks) {
    console.log(`✓ ${name}`);
  }
  console.log(`\nAll ${checks.length} critical API journeys passed.`);
}

run().catch((error) => {
  console.error(`\nCritical API journey failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
