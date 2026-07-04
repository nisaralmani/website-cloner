#!/usr/bin/env node

/**
 * Smoke-test Shopify stack routes on chat.bybelt.com (or SHOPIFY_SMOKE_BASE_URL).
 * Usage: node scripts/shopify-stack-smoke.mjs
 */

const base = (process.env.SHOPIFY_SMOKE_BASE_URL ?? "https://chat.bybelt.com").replace(
  /\/$/,
  "",
);
const shop = process.env.SHOPIFY_SMOKE_SHOP ?? "zee-ai-0bcob6pl.myshopify.com";
const browserUa =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const checks = [
  {
    name: "OAuth initiate redirects",
    url: `${base}/initiate/plugin/shopify?shop=${encodeURIComponent(shop)}`,
    expectStatus: 302,
  },
  {
    name: "Auth route redirects",
    url: `${base}/auth?shop=${encodeURIComponent(shop)}`,
    expectStatus: [301, 302],
  },
  {
    name: "Auth trailing slash redirects",
    url: `${base}/auth/?shop=${encodeURIComponent(shop)}`,
    expectStatus: [301, 302],
  },
  {
    name: "Plugin CSS asset",
    url: `${base}/assets/PluginShell-BBnJUb__.css`,
    expectStatus: 200,
  },
  {
    name: "Chatbox embed.js",
    url: `${base}/embed.js`,
    expectStatus: 200,
  },
  {
    name: "Webhook HEAD returns 405",
    url: `${base}/webhooks/app/uninstalled`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "App scopes update webhook HEAD returns 405",
    url: `${base}/webhooks/app/scopes_update`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Customers update webhook HEAD returns 405",
    url: `${base}/webhooks/customers/update`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Orders create webhook HEAD returns 405",
    url: `${base}/webhooks/orders/create`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Orders updated webhook HEAD returns 405",
    url: `${base}/webhooks/orders/updated`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Orders cancelled webhook HEAD returns 405",
    url: `${base}/webhooks/orders/cancelled`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Orders paid webhook HEAD returns 405",
    url: `${base}/webhooks/orders/paid`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Refunds create webhook HEAD returns 405",
    url: `${base}/webhooks/refunds/create`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Fulfillments create webhook HEAD returns 405",
    url: `${base}/webhooks/fulfillments/create`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Customers delete webhook HEAD returns 405",
    url: `${base}/webhooks/customers/delete`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Customers data request webhook HEAD returns 405",
    url: `${base}/webhooks/customers/data_request`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Customers redact webhook HEAD returns 405",
    url: `${base}/webhooks/customers/redact`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Shop redact webhook HEAD returns 405",
    url: `${base}/webhooks/shop/redact`,
    method: "HEAD",
    expectStatus: 405,
  },
  {
    name: "Internal health requires auth",
    url: `${base}/plugin/shopify/internal/health`,
    expectStatus: 401,
  },
  {
    name: "Internal sync-status requires auth",
    url: `${base}/plugin/shopify/internal/sync-status?workspaceId=test`,
    expectStatus: 401,
  },
  {
    name: "Bybelt login page",
    url: `${base}/initiate/login`,
    expectStatus: 200,
  },
  {
    name: "React Router login.data route",
    url: `${base}/initiate/login.data`,
    expectStatus: 202,
  },
  {
    name: "Settings without session serves plugin or redirects",
    url: `${base}/plugin/shopify/settings?shop=${encodeURIComponent(shop)}&onboard=1`,
    expectStatus: [200, 302],
  },
  {
    name: "Internal sync requires auth",
    url: `${base}/plugin/shopify/internal/sync?workspaceId=test`,
    expectStatus: 401,
  },
  {
    name: "Internal workspaces requires auth",
    url: `${base}/plugin/shopify/internal/workspaces`,
    expectStatus: 401,
  },
];

let failed = 0;

const internalSecret = process.env.BYBELT_INTERNAL_SECRET?.trim();
if (internalSecret) {
  checks.push({
    name: "Internal health with auth",
    url: `${base}/plugin/shopify/internal/health`,
    headers: { "X-Bybelt-Internal-Secret": internalSecret },
    expectStatus: 200,
    expectJsonOk: true,
  });
}

for (const check of checks) {
  try {
    const response = await fetch(check.url, {
      method: check.method ?? "GET",
      redirect: "manual",
      headers: {
        "User-Agent": browserUa,
        ...(check.headers ?? {}),
      },
    });
    const expected = check.expectStatus;
    let ok = Array.isArray(expected)
      ? expected.includes(response.status)
      : response.status === expected;
    if (ok && check.expectLocationIncludes) {
      const location = decodeURIComponent(response.headers.get("location") ?? "");
      ok = location.includes(check.expectLocationIncludes);
    }
    if (ok && check.expectJsonOk) {
      const payload = await response.json().catch(() => null);
      ok = payload?.ok === true;
    }
    console.log(`${ok ? "✓" : "✗"} ${check.name}: ${response.status} (expected ${check.expectStatus})`);
    if (!ok) failed += 1;
  } catch (error) {
    console.log(`✗ ${check.name}: ${error instanceof Error ? error.message : "error"}`);
    failed += 1;
  }
}

if (failed > 0) {
  process.exitCode = 1;
  console.error(`\n${failed} check(s) failed.`);
} else {
  console.log("\nAll Shopify stack smoke checks passed.");
}
