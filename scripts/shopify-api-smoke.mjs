#!/usr/bin/env node

/**
 * Authenticated smoke tests for Shopify internal bridge APIs.
 * Usage: BYBELT_INTERNAL_SECRET=... SHOPIFY_SMOKE_WORKSPACE_ID=... [SHOPIFY_SMOKE_EMAIL=...] node scripts/shopify-api-smoke.mjs
 */

const base = (process.env.SHOPIFY_SMOKE_BASE_URL ?? "https://chat.bybelt.com").replace(
  /\/$/,
  "",
);
const secret = process.env.BYBELT_INTERNAL_SECRET?.trim();
const workspaceId = process.env.SHOPIFY_SMOKE_WORKSPACE_ID?.trim();
const smokeEmail = process.env.SHOPIFY_SMOKE_EMAIL?.trim();

if (!secret) {
  console.error("BYBELT_INTERNAL_SECRET is required for shopify-api-smoke.");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  "X-Bybelt-Internal-Secret": secret,
};

const checks = [
  {
    name: "Internal health",
    url: `${base}/plugin/shopify/internal/health`,
    expectStatus: 200,
    expectOk: true,
    expectWebhookTopicCount: true,
  },
  {
    name: "Internal workspaces",
    url: `${base}/plugin/shopify/internal/workspaces`,
    expectStatus: 200,
    expectWorkspaceIds: true,
  },
];

if (workspaceId) {
  checks.push(
    {
      name: "Workspace Shopify status",
      url: `${base}/plugin/shopify/internal/customer?workspaceId=${encodeURIComponent(workspaceId)}`,
      expectStatus: 200,
      expectLinkedField: true,
      expectShopFieldWhenLinked: true,
    },
    {
      name: "Workspace sync status",
      url: `${base}/plugin/shopify/internal/sync-status?workspaceId=${encodeURIComponent(workspaceId)}`,
      expectStatus: 200,
      expectLinkedField: true,
      expectWebhookTopicCount: true,
    },
    {
      name: "Workspace customer sync",
      url: `${base}/plugin/shopify/internal/sync?workspaceId=${encodeURIComponent(workspaceId)}`,
      expectStatus: 200,
      expectCustomersArray: true,
    },
  );
}

if (workspaceId && smokeEmail) {
  checks.push({
    name: "Customer context by email",
    method: "POST",
    url: `${base}/plugin/shopify/internal/customer`,
    body: { workspaceId, email: smokeEmail },
    expectStatus: 200,
    expectLinkedField: true,
    expectCustomerFields: true,
  });
}

let failed = 0;

for (const check of checks) {
  try {
    const response = await fetch(check.url, {
      method: check.method ?? "GET",
      headers,
      cache: "no-store",
      ...(check.body ? { body: JSON.stringify(check.body) } : {}),
    });
    const payload = await response.json().catch(() => null);
    let ok = response.status === check.expectStatus;
    if (ok && check.expectOk) ok = payload?.ok === true;
    if (ok && check.expectWebhookTopicCount) {
      ok = typeof payload?.webhookTopicCount === "number" && payload.webhookTopicCount > 0;
    }
    if (ok && check.expectWorkspaceIds) ok = Array.isArray(payload?.workspaceIds);
    if (ok && check.expectLinkedField) ok = typeof payload?.linked === "boolean";
    if (ok && check.expectShopFieldWhenLinked && payload?.linked === true) {
      ok = typeof payload?.shop === "string" && payload.shop.length > 0;
    }
    if (ok && check.expectCustomerFields && payload?.customer) {
      ok =
        typeof payload.customer.orderCount === "number" &&
        Array.isArray(payload.customer.tags);
    }
    if (ok && check.expectCustomersArray) {
      ok = Array.isArray(payload?.customers);
    }
    console.log(`${ok ? "✓" : "✗"} ${check.name}: ${response.status}`);
    if (!ok) failed += 1;
  } catch (error) {
    console.log(`✗ ${check.name}: ${error instanceof Error ? error.message : "error"}`);
    failed += 1;
  }
}

if (failed > 0) {
  process.exitCode = 1;
  console.error(`\n${failed} authenticated Shopify API check(s) failed.`);
} else {
  console.log("\nAll authenticated Shopify API smoke checks passed.");
}
