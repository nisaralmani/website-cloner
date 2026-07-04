/**
 * Backend API smoke tests — requires seeded SQLite DB and running Next server.
 *
 * Usage:
 *   SMOKE_BASE_URL=http://127.0.0.1:3099 node scripts/smoke-api-tests.mjs
 *   node scripts/smoke-api.mjs   # seeds DB, starts server, runs tests
 */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import net from "node:net";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseSettingsSlugs } from "./smoke-registry.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SEED_EMAIL = "contact@fashionpara.com";
const SEED_OPERATOR2_EMAIL = "team@fashionpara.com";
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD ?? "fashionsis-dev";
const SESSION_COOKIE = "bybelt_session";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.listen(0, () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
    probe.on("error", reject);
  });
}

async function waitForServer(base) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(base);
      if (response.ok || response.status === 307 || response.status === 308) return;
    } catch {
      // retry
    }
    await wait(1000);
  }
  throw new Error(`Server not ready at ${base}`);
}

function parseSetCookie(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function mergeCookieJar(jar, response) {
  const next = new Map(jar);

  for (const raw of parseSetCookie(response)) {
    const [pair, ...attrs] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq === -1) continue;

    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    const maxAgeAttr = attrs.find((part) => part.trim().toLowerCase().startsWith("max-age="));
    const maxAge = maxAgeAttr ? Number(maxAgeAttr.split("=")[1]) : null;

    if (value === "" || maxAge === 0) {
      next.delete(name);
    } else {
      next.set(name, value);
    }
  }

  return next;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function request(base, jar, method, route, body) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: {
      ...(jar.size > 0 ? { Cookie: cookieHeader(jar) } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return {
    response,
    jar: mergeCookieJar(jar, response),
  };
}

async function requestMultipart(base, jar, method, route, formData) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: {
      ...(jar.size > 0 ? { Cookie: cookieHeader(jar) } : {}),
    },
    body: formData,
  });

  return {
    response,
    jar: mergeCookieJar(jar, response),
  };
}

async function expectStatus(label, result, status) {
  if (result.response.status !== status) {
    const text = await result.response.text();
    throw new Error(
      `${label}: expected ${status}, got ${result.response.status}: ${text.slice(0, 240)}`,
    );
  }
  return result;
}

async function expectJson(label, result, status, predicate) {
  await expectStatus(label, result, status);
  const data = await result.response.json();
  if (predicate && !predicate(data)) {
    throw new Error(`${label}: response failed validation: ${JSON.stringify(data).slice(0, 240)}`);
  }
  return { ...result, data };
}

async function switchWorkspace(base, jar, workspaceId, label) {
  const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
  return expectJson(label, switched, 200, (data) => data.workspace?.id === workspaceId);
}

async function upgradeWorkspacePlan(base, jar, workspaceId, planTag, label) {
  const upgraded = await request(base, jar, "PATCH", "/api/billing/plans", {
    workspaceId,
    planTag,
  });
  return expectJson(label, upgraded, 200, (data) => Boolean(data.plan?.planTag === planTag));
}

async function ensureHelpdeskPlan(base, jar, workspaceId) {
  return upgradeWorkspacePlan(
    base,
    jar,
    workspaceId,
    "Plus",
    "PATCH /api/billing/plans plus helpdesk",
  );
}

async function resetAllWorkspacePlansFree(base, jar) {
  const session = await request(base, jar, "GET", "/api/auth/session");
  const sessionData = await expectJson("GET /api/auth/session reset plans", session, 200, (data) =>
    Array.isArray(data.workspaces),
  );

  for (const workspace of sessionData.data.workspaces) {
    const downgraded = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId: workspace.id,
      planTag: "Free",
    });
    await expectJson(
      `PATCH /api/billing/plans free ${workspace.name}`,
      downgraded,
      200,
      (data) => data.plan?.planTag === "Free",
    );
  }

  return sessionData.jar;
}

async function resetAlternateWorkspaceChatboxAppearance(base, jar) {
  const sessionResult = await request(base, jar, "GET", "/api/auth/session");
  const sessionData = await expectJson(
    "GET /api/auth/session for appearance reset",
    sessionResult,
    200,
  );
  const alternate = sessionData.data.workspaces.find(
    (workspace) => workspace.id !== sessionData.data.workspace.id,
  );
  if (!alternate) {
    return sessionData.jar;
  }

  const switched = await switchWorkspace(
    base,
    sessionData.jar,
    alternate.id,
    "POST /api/auth/workspace reset appearance alternate",
  );
  await request(base, switched.jar, "PATCH", "/api/settings/chatbox/appearance", {
    key: "colorTheme",
    value: "Default (Blue)",
  });
  await request(base, switched.jar, "PATCH", "/api/settings/chatbox/appearance", {
    key: "1-0",
    on: false,
  });
  await request(base, switched.jar, "PATCH", "/api/settings/chatbox/behavior", {
    key: "defaultSection",
    value: "Messages (default)",
  });
  await request(base, switched.jar, "PATCH", "/api/settings/chatbox/behavior", {
    key: "1-0",
    on: true,
  });
  await request(base, switched.jar, "PATCH", "/api/settings/chatbox/security", {
    key: "0-0",
    on: false,
  });
  await request(base, switched.jar, "PATCH", "/api/settings/chatbox/restrictions", {
    key: "0-0",
    on: false,
  });
  await request(base, switched.jar, "PATCH", "/api/settings/chatbox/push", {
    key: "0-0",
    on: false,
  });
  await request(base, switched.jar, "PATCH", "/api/settings/chatbox/push", {
    key: "1-0",
    on: false,
  });

  const restored = await switchWorkspace(
    base,
    switched.jar,
    sessionData.data.workspace.id,
    "POST /api/auth/workspace restore after appearance reset",
  );
  return restored.jar;
}

async function resetAlternateWorkspaceEmailBehavior(base, jar) {
  const sessionResult = await request(base, jar, "GET", "/api/auth/session");
  const sessionData = await expectJson(
    "GET /api/auth/session for email behavior reset",
    sessionResult,
    200,
  );
  const alternate = sessionData.data.workspaces.find(
    (workspace) => workspace.id !== sessionData.data.workspace.id,
  );
  if (!alternate) {
    return sessionData.jar;
  }

  const switched = await switchWorkspace(
    base,
    sessionData.jar,
    alternate.id,
    "POST /api/auth/workspace reset email behavior alternate",
  );
  const defaults = [
    { key: "0-0", on: true },
    { key: "0-1", on: true },
    { key: "0-2", on: true },
    { key: "1-0", on: false },
  ];
  for (const toggle of defaults) {
    await request(base, switched.jar, "PATCH", "/api/settings/email/behavior", toggle);
  }

  const restored = await switchWorkspace(
    base,
    switched.jar,
    sessionData.data.workspace.id,
    "POST /api/auth/workspace restore after email behavior reset",
  );
  return restored.jar;
}

async function resetAlternateWorkspaceEmailDomain(base, jar) {
  const sessionResult = await request(base, jar, "GET", "/api/auth/session");
  const sessionData = await expectJson(
    "GET /api/auth/session for email domain reset",
    sessionResult,
    200,
  );
  const alternate = sessionData.data.workspaces.find(
    (workspace) => workspace.id !== sessionData.data.workspace.id,
  );
  if (!alternate) {
    return sessionData.jar;
  }

  const switched = await switchWorkspace(
    base,
    sessionData.jar,
    alternate.id,
    "POST /api/auth/workspace reset email domain alternate",
  );
  await request(base, switched.jar, "PATCH", "/api/settings/email/domain", {
    key: "basicDomain",
    value: "fabzop",
  });
  await request(base, switched.jar, "PATCH", "/api/settings/email/domain", {
    key: "customDomain",
    value: "",
  });

  const restored = await switchWorkspace(
    base,
    switched.jar,
    sessionData.data.workspace.id,
    "POST /api/auth/workspace restore after email domain reset",
  );
  return restored.jar;
}

async function resetAlternateWorkspaceEmailDelivery(base, jar) {
  const sessionResult = await request(base, jar, "GET", "/api/auth/session");
  const sessionData = await expectJson(
    "GET /api/auth/session for email delivery reset",
    sessionResult,
    200,
  );
  const alternate = sessionData.data.workspaces.find(
    (workspace) => workspace.id !== sessionData.data.workspace.id,
  );
  if (!alternate) {
    return sessionData.jar;
  }

  const switched = await switchWorkspace(
    base,
    sessionData.jar,
    alternate.id,
    "POST /api/auth/workspace reset email delivery alternate",
  );
  await request(base, switched.jar, "PATCH", "/api/settings/email/delivery", {
    key: "1-0",
    on: false,
  });

  const restored = await switchWorkspace(
    base,
    switched.jar,
    sessionData.data.workspace.id,
    "POST /api/auth/workspace restore after email delivery reset",
  );
  return restored.jar;
}

async function resetUserPaymentMethods(base, jar) {
  const list = await request(base, jar, "GET", "/api/billing/cards");
  const listData = await expectJson("GET /api/billing/cards for reset", list, 200);
  for (const card of listData.data.cards ?? []) {
    await request(base, jar, "DELETE", `/api/billing/cards/${card.id}`);
  }
  return jar;
}

async function resetUserInvoices(base, jar) {
  const list = await request(base, jar, "GET", "/api/billing/invoices");
  const listData = await expectJson("GET /api/billing/invoices for reset", list, 200);
  for (const invoice of listData.data.invoices ?? []) {
    await request(base, jar, "DELETE", `/api/billing/invoices/${invoice.id}`);
  }
  return jar;
}

async function resetWorkspaceBillingPaymentMethod(base, jar) {
  await request(base, jar, "PATCH", "/api/workspaces/billing", { paymentMethodId: null });
  return jar;
}

function parseSseBuffer(buffer) {
  const events = [];
  let rest = buffer;
  let separator;
  while ((separator = rest.indexOf("\n\n")) !== -1) {
    const block = rest.slice(0, separator);
    rest = rest.slice(separator + 2);
    for (const line of block.split("\n")) {
      if (line.startsWith("data: ")) {
        events.push(JSON.parse(line.slice(6)));
      }
    }
  }
  return { events, rest };
}

async function openInboxStream(base, jar, conversationId) {
  const controller = new AbortController();
  const response = await fetch(
    `${base}/api/inbox/stream?conversation=${encodeURIComponent(conversationId)}`,
    {
      headers: { Cookie: cookieHeader(jar) },
      signal: controller.signal,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SSE open failed: ${response.status} ${text.slice(0, 200)}`);
  }

  if (!response.body) {
    throw new Error("SSE response has no body");
  }

  const collected = [];
  let buffer = "";
  let resolveWait = null;
  let waitPredicate = null;
  let waitReject = null;
  let waitTimer = null;

  const notify = (event) => {
    collected.push(event);
    if (waitPredicate?.(event)) {
      const resolve = resolveWait;
      const reject = waitReject;
      clearTimeout(waitTimer);
      resolveWait = null;
      waitPredicate = null;
      waitReject = null;
      waitTimer = null;
      resolve?.();
      void reject;
    }
  };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  const pump = (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseBuffer(buffer);
        buffer = parsed.rest;
        for (const event of parsed.events) notify(event);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError" && waitReject) {
        waitReject(error);
      }
    }
  })();

  return {
    events: collected,
    waitFor(predicate, ms = 10_000) {
      if (collected.some(predicate)) return Promise.resolve();
      return new Promise((resolve, reject) => {
        waitPredicate = predicate;
        resolveWait = resolve;
        waitReject = reject;
        waitTimer = setTimeout(() => {
          waitPredicate = null;
          resolveWait = null;
          waitReject = null;
          const seen = collected.map((event) => event.type).join(", ") || "none";
          reject(new Error(`SSE timeout after ${ms}ms (events: ${seen})`));
        }, ms);
      });
    },
    close() {
      controller.abort();
      return pump.catch(() => {});
    },
  };
}

async function openChatboxStream(base, sessionId) {
  const controller = new AbortController();
  const response = await fetch(`${base}/api/chatbox/sessions/${encodeURIComponent(sessionId)}/stream`, {
    signal: controller.signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Chatbox SSE open failed: ${response.status} ${text.slice(0, 200)}`);
  }

  if (!response.body) {
    throw new Error("Chatbox SSE response has no body");
  }

  const collected = [];
  let buffer = "";
  let resolveWait = null;
  let waitPredicate = null;
  let waitReject = null;
  let waitTimer = null;

  const notify = (event) => {
    collected.push(event);
    if (waitPredicate?.(event)) {
      const resolve = resolveWait;
      clearTimeout(waitTimer);
      resolveWait = null;
      waitPredicate = null;
      waitReject = null;
      waitTimer = null;
      resolve?.();
    }
  };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  const pump = (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseBuffer(buffer);
        buffer = parsed.rest;
        for (const event of parsed.events) notify(event);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError" && waitReject) {
        waitReject(error);
      }
    }
  })();

  return {
    events: collected,
    waitFor(predicate, ms = 10_000) {
      if (collected.some(predicate)) return Promise.resolve();
      return new Promise((resolve, reject) => {
        waitPredicate = predicate;
        resolveWait = resolve;
        waitReject = reject;
        waitTimer = setTimeout(() => {
          waitPredicate = null;
          resolveWait = null;
          waitReject = null;
          const seen = collected.map((event) => event.type).join(", ") || "none";
          reject(new Error(`Chatbox SSE timeout after ${ms}ms (events: ${seen})`));
        }, ms);
      });
    },
    close() {
      controller.abort();
      return pump.catch(() => {});
    },
  };
}

/**
 * @param {string} baseUrl e.g. http://127.0.0.1:3099
 */
export async function runApiSmoke(baseUrl) {
  const base = baseUrl.replace(/\/$/, "");
  let jar = new Map();
  const settingsSlug = parseSettingsSlugs()[0];
  if (!settingsSlug) {
    throw new Error("No settings slugs found for API smoke");
  }

  const tests = [];

  async function step(name, fn) {
    await fn();
    tests.push(name);
    console.log(`PASS ${name}`);
  }

  await step("session unauthenticated", async () => {
    const result = await request(base, jar, "GET", "/api/auth/session");
    await expectStatus("GET /api/auth/session", result, 401);
  });

  await step("login invalid credentials", async () => {
    const result = await request(base, jar, "POST", "/api/auth/login", {
      email: SEED_EMAIL,
      password: "wrong-password",
    });
    await expectStatus("POST /api/auth/login invalid", result, 401);
  });

  await step("protected route without session", async () => {
    const result = await request(base, jar, "GET", "/api/conversations");
    await expectStatus("GET /api/conversations unauthenticated", result, 401);
  });

  await step("inbox stream unauthenticated", async () => {
    const result = await request(base, jar, "GET", "/api/inbox/stream");
    await expectStatus("GET /api/inbox/stream unauthenticated", result, 401);
  });

  let conversationId = "c1";
  let homeWorkspaceId = null;

  await step("login success", async () => {
    const result = await request(base, jar, "POST", "/api/auth/login", {
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      remember: true,
    });
    const checked = await expectJson("POST /api/auth/login", result, 200, (data) =>
      Boolean(data.user?.email === SEED_EMAIL && data.workspace?.name),
    );
    jar = checked.jar;
    if (!jar.has(SESSION_COOKIE)) {
      throw new Error("Login did not set session cookie");
    }

    const online = await request(base, jar, "PATCH", "/api/auth/presence", { status: "online" });
    const onlineChecked = await expectJson("PATCH /api/auth/presence after login", online, 200, (data) =>
      Boolean(data.user?.presence === "online"),
    );
    jar = onlineChecked.jar;
  });

  await step("account security", async () => {
    const sessions = await request(base, jar, "GET", "/api/auth/sessions");
    await expectJson("GET /api/auth/sessions", sessions, 200, (data) =>
      Boolean(data.currentSessionId && data.activeSessions?.length >= 1),
    );

    const altJar = new Map();
    const altLogin = await request(base, altJar, "POST", "/api/auth/login", {
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      remember: true,
    });
    await expectJson("POST /api/auth/login second session", altLogin, 200);

    const withTwo = await request(base, jar, "GET", "/api/auth/sessions");
    const withTwoChecked = await expectJson(
      "GET /api/auth/sessions two active",
      withTwo,
      200,
      (data) => Boolean(data.activeSessions?.length >= 2),
    );

    const other = withTwoChecked.data.activeSessions.find((session) => !session.isCurrent);
    if (!other) {
      throw new Error("No secondary session available to revoke");
    }

    const closed = await request(base, jar, "DELETE", "/api/auth/sessions", {
      sessionId: other.id,
    });
    await expectJson("DELETE /api/auth/sessions", closed, 200, (data) =>
      Boolean(data.ok && data.activeSessions?.length >= 1),
    );

    const altSession = await request(base, altJar, "GET", "/api/auth/session");
    await expectStatus("GET /api/auth/session after revoke", altSession, 401);
  });

  await step("session authenticated", async () => {
    const result = await request(base, jar, "GET", "/api/auth/session");
    const checked = await expectJson("GET /api/auth/session", result, 200, (data) =>
      Boolean(data.authenticated && data.user?.email === SEED_EMAIL && data.user?.presence === "online"),
    );
    jar = checked.jar;
  });

  await step("presence toggle", async () => {
    const offline = await request(base, jar, "PATCH", "/api/auth/presence", { status: "offline" });
    const offlineChecked = await expectJson("PATCH /api/auth/presence offline", offline, 200, (data) =>
      Boolean(data.user?.presence === "offline"),
    );
    jar = offlineChecked.jar;

    const availabilityOffline = await request(
      base,
      jar,
      "GET",
      "/api/settings/account/availability",
    );
    await expectJson(
      "GET /api/settings/account/availability manual offline",
      availabilityOffline,
      200,
      (data) => data.presence === "offline" && data.toggles?.["0-0"] === false,
    );

    const forceOffline = await request(base, jar, "PATCH", "/api/settings/account/availability", {
      key: "0-0",
      on: true,
    });
    await expectJson("PATCH availability force offline on", forceOffline, 200, (data) =>
      data.presence === "offline" && data.on === true,
    );

    const session = await request(base, jar, "GET", "/api/auth/session");
    await expectJson("GET /api/auth/session force offline", session, 200, (data) =>
      Boolean(data.user?.presence === "offline" && data.user?.forceOffline === true),
    );

    const settingsOnline = await request(base, jar, "PATCH", "/api/settings/account/availability", {
      key: "0-0",
      on: false,
    });
    await expectJson("PATCH availability force offline off", settingsOnline, 200, (data) =>
      data.presence === "online" && data.on === false,
    );

    const online = await request(base, jar, "PATCH", "/api/auth/presence", { status: "online" });
    await expectJson("PATCH /api/auth/presence online", online, 200, (data) =>
      Boolean(data.user?.presence === "online"),
    );
  });

  await step("auto available activity", async () => {
    const disableAuto = await request(base, jar, "PATCH", "/api/settings/account/availability", {
      key: "0-1",
      on: false,
    });
    await expectJson("PATCH auto available off", disableAuto, 200, (data) => data.on === false);

    const inactiveIgnored = await request(base, jar, "POST", "/api/auth/activity", {
      active: false,
    });
    const inactiveChecked = await expectJson("POST /api/auth/activity ignored", inactiveIgnored, 200);
    await expectJson("GET /api/auth/session auto off", await request(base, inactiveChecked.jar, "GET", "/api/auth/session"), 200, (data) =>
      Boolean(data.user?.autoAvailable === false && data.user?.presence === "online"),
    );

    const enableAuto = await request(base, jar, "PATCH", "/api/settings/account/availability", {
      key: "0-1",
      on: true,
    });
    await expectJson("PATCH auto available on", enableAuto, 200, (data) => data.on === true);

    const active = await request(base, jar, "POST", "/api/auth/activity", { active: true });
    await expectJson("POST /api/auth/activity active", active, 200, (data) =>
      Boolean(data.presence === "online" && data.user?.autoAvailable === true),
    );

    const away = await request(base, jar, "POST", "/api/auth/activity", { active: false });
    await expectJson("POST /api/auth/activity inactive", away, 200, (data) =>
      Boolean(data.presence === "offline"),
    );

    const restore = await request(base, jar, "POST", "/api/auth/activity", { active: true });
    const restored = await expectJson("POST /api/auth/activity restore", restore, 200);
    jar = restored.jar;
  });

  await step("workspace list", async () => {
    const result = await request(base, jar, "GET", "/api/auth/session");
    await expectJson("GET /api/auth/session workspaces", result, 200, (data) =>
      Array.isArray(data.workspaces) && data.workspaces.length >= 2,
    );
  });

  await step("workspace switch", async () => {
    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson("GET /api/auth/session before switch", sessionResult, 200);
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const conversations = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations after switch", conversations, 200, (data) =>
      Array.isArray(data.conversations),
    );

    const restore = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    const restored = await expectJson("POST /api/auth/workspace restore", restore, 200);
    jar = restored.jar;
  });

  await step("auth providers", async () => {
    const result = await request(base, jar, "GET", "/api/auth/providers");
    await expectJson("GET /api/auth/providers", result, 200, (data) =>
      typeof data.google === "boolean",
    );
  });

  await step("conversations list", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson(
      "GET /api/auth/session for home workspace",
      session,
      200,
      (data) => Boolean(data.workspace?.id),
    );
    homeWorkspaceId = sessionChecked.data.workspace.id;

    const result = await request(base, jar, "GET", "/api/conversations");
    const checked = await expectJson("GET /api/conversations", result, 200, (data) =>
      Array.isArray(data.conversations) && data.conversations.length > 0,
    );
    conversationId = checked.data.conversations[0]?.id ?? conversationId;
  });

  await step("conversation detail", async () => {
    const result = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id]", result, 200, (data) =>
      Boolean(data.conversation?.id === conversationId && Array.isArray(data.messages)),
    );
  });

  await step("conversation status", async () => {
    const resolved = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      status: "resolved",
    });
    await expectJson("PATCH /api/conversations/[id] resolved", resolved, 200, (data) =>
      data.conversation?.status === "resolved",
    );

    const invalid = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      status: "invalid",
    });
    if (invalid.response.status !== 400) {
      throw new Error(
        `PATCH /api/conversations/[id] invalid status expected 400, got ${invalid.response.status}`,
      );
    }

    const restored = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      status: "pending",
    });
    await expectJson("PATCH /api/conversations/[id] pending", restored, 200, (data) =>
      data.conversation?.status === "pending",
    );
  });

  await step("conversation unread", async () => {
    const setUnreadCount = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      unread: 4,
    });
    await expectJson("PATCH /api/conversations/[id] unread", setUnreadCount, 200, (data) =>
      data.conversation?.unread === 4,
    );

    const invalidUnread = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      unread: -1,
    });
    if (invalidUnread.response.status !== 400) {
      throw new Error(
        `PATCH /api/conversations/[id] invalid unread expected 400, got ${invalidUnread.response.status}`,
      );
    }

    const markRead = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      unread: 0,
    });
    await expectJson("PATCH /api/conversations/[id] mark read", markRead, 200, (data) =>
      data.conversation?.unread === 0,
    );

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations unread cleared", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === conversationId);
      return conversation?.unread === 0;
    });
  });

  await step("mark conversation unread", async () => {
    const markUnread = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      unread: 1,
    });
    await expectJson("PATCH /api/conversations/[id] mark unread", markUnread, 200, (data) =>
      data.conversation?.unread === 1,
    );

    const combined = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      status: "pending",
      unread: 2,
    });
    await expectJson("PATCH /api/conversations/[id] combined", combined, 200, (data) =>
      data.conversation?.status === "pending" && data.conversation?.unread === 2,
    );

    const markRead = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      unread: 0,
    });
    await expectJson("PATCH /api/conversations/[id] mark read again", markRead, 200, (data) =>
      data.conversation?.unread === 0,
    );
  });

  await step("customer email", async () => {
    const email = `visitor-smoke-${Date.now()}@example.com`;

    const setEmail = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      customerEmail: email,
    });
    await expectJson("PATCH /api/conversations/[id] customer email", setEmail, 200, (data) =>
      data.details?.email === email,
    );

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] customer email", detail, 200, (data) =>
      data.details?.email === email,
    );

    const invalid = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      customerEmail: "not-an-email",
    });
    if (invalid.response.status !== 400) {
      throw new Error(
        `PATCH /api/conversations/[id] invalid email expected 400, got ${invalid.response.status}`,
      );
    }

    const cleared = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      customerEmail: null,
    });
    await expectJson("PATCH /api/conversations/[id] clear customer email", cleared, 200, (data) =>
      data.details?.email === null,
    );
  });

  await step("visitor data", async () => {
    const dataKey = "order_id";
    const dataValue = `smoke-${Date.now()}`;

    const saved = await request(base, jar, "PUT", `/api/conversations/${conversationId}/visitor-data`, {
      key: dataKey,
      value: dataValue,
    });
    await expectJson("PUT /api/conversations/[id]/visitor-data", saved, 200, (data) =>
      Boolean(
        data.details?.visitorData?.some(
          (entry) => entry.key === dataKey && entry.value === dataValue,
        ),
      ),
    );

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] visitor data", detail, 200, (data) =>
      Boolean(
        data.details?.visitorData?.some(
          (entry) => entry.key === dataKey && entry.value === dataValue,
        ),
      ),
    );

    const updated = await request(base, jar, "PUT", `/api/conversations/${conversationId}/visitor-data`, {
      key: dataKey,
      value: "updated-value",
    });
    await expectJson("PUT /api/conversations/[id]/visitor-data upsert", updated, 200, (data) =>
      Boolean(
        data.details?.visitorData?.some(
          (entry) => entry.key === dataKey && entry.value === "updated-value",
        ),
      ),
    );

    const invalid = await request(base, jar, "PUT", `/api/conversations/${conversationId}/visitor-data`, {
      key: "   ",
      value: "x",
    });
    if (invalid.response.status !== 400) {
      throw new Error(
        `PUT /api/conversations/[id]/visitor-data empty key expected 400, got ${invalid.response.status}`,
      );
    }

    const removed = await request(
      base,
      jar,
      "DELETE",
      `/api/conversations/${conversationId}/visitor-data`,
      { key: dataKey },
    );
    await expectJson("DELETE /api/conversations/[id]/visitor-data", removed, 200, (data) =>
      !data.details?.visitorData?.some((entry) => entry.key === dataKey),
    );
  });

  await step("conversation segments", async () => {
    const segment = `priority-${Date.now()}`;

    const added = await request(base, jar, "POST", `/api/conversations/${conversationId}/segments`, {
      segment,
    });
    await expectJson("POST /api/conversations/[id]/segments", added, 200, (data) =>
      Boolean(
        data.details?.segments?.includes(segment)
          && data.conversation?.segments?.includes(segment),
      ),
    );

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] segments", detail, 200, (data) =>
      data.details?.segments?.includes(segment),
    );

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations segments", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === conversationId);
      return conversation?.segments?.includes(segment);
    });

    const duplicate = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${conversationId}/segments`,
      { segment },
    );
    await expectJson("POST /api/conversations/[id]/segments duplicate", duplicate, 200, (data) =>
      data.details?.segments?.filter((item) => item === segment).length === 1,
    );

    const invalid = await request(base, jar, "POST", `/api/conversations/${conversationId}/segments`, {
      segment: "   ",
    });
    if (invalid.response.status !== 400) {
      throw new Error(
        `POST /api/conversations/[id]/segments empty segment expected 400, got ${invalid.response.status}`,
      );
    }

    const removed = await request(
      base,
      jar,
      "DELETE",
      `/api/conversations/${conversationId}/segments`,
      { segment },
    );
    await expectJson("DELETE /api/conversations/[id]/segments", removed, 200, (data) =>
      !data.details?.segments?.includes(segment),
    );
  });

  await step("visitor message", async () => {
    const resolved = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      status: "resolved",
      unread: 0,
    });
    await expectJson("PATCH /api/conversations/[id] resolved before visitor", resolved, 200, (data) =>
      data.conversation?.status === "resolved" && data.conversation?.unread === 0,
    );

    const visitorText = `Visitor smoke ${Date.now()}`;
    const created = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${conversationId}/visitor-messages`,
      { text: visitorText },
    );
    await expectJson("POST /api/conversations/[id]/visitor-messages", created, 200, (data) =>
      Boolean(
        data.message?.from === "visitor"
          && data.message.text === visitorText
          && data.conversation?.unread === 1
          && data.conversation?.status === "pending",
      ),
    );

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] after visitor message", detail, 200, (data) =>
      Boolean(
        data.messages?.some(
          (message) => message.from === "visitor" && message.text === visitorText,
        ),
      ),
    );

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations visitor unread", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === conversationId);
      return conversation?.unread === 1 && conversation?.status === "pending";
    });

    const invalid = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${conversationId}/visitor-messages`,
      { text: "   " },
    );
    if (invalid.response.status !== 400) {
      throw new Error(
        `POST /api/conversations/[id]/visitor-messages empty text expected 400, got ${invalid.response.status}`,
      );
    }

    const markRead = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      unread: 0,
    });
    await expectJson("PATCH /api/conversations/[id] mark read after visitor", markRead, 200, (data) =>
      data.conversation?.unread === 0,
    );
  });

  await step("visitor chatbox ingest", async () => {
    const publicJar = new Map();
    const sessionBefore = await request(base, jar, "GET", "/api/auth/session");
    const beforeChecked = await expectJson(
      "GET /api/auth/session before chatbox ingest",
      sessionBefore,
      200,
      (data) => Boolean(data.workspace?.id),
    );
    const homeWorkspaceId = beforeChecked.data.workspace.id;

    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson("GET /api/chatbox/config", config, 200, (data) =>
      Boolean(data.workspaceId && data.domain === "fashionsis.com" && data.name),
    );
    const workspaceId = configChecked.data.workspaceId;

    const switchRes = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    await expectStatus("POST /api/auth/workspace for chatbox ingest init", switchRes, 200);
    jar = switchRes.jar;

    const secPatch = await request(base, jar, "PATCH", "/api/settings/chatbox/security", {
      key: "0-0",
      on: false,
    });
    await expectStatus("PATCH /api/settings/chatbox/security", secPatch, 200);
    jar = secPatch.jar;

    const restPatch = await request(base, jar, "PATCH", "/api/settings/chatbox/restrictions", {
      key: "0-0",
      on: false,
    });
    await expectStatus("PATCH /api/settings/chatbox/restrictions", restPatch, 200);
    jar = restPatch.jar;

    const existingRestrictions = await request(base, jar, "GET", "/api/chatbox/restrictions");
    const existingRestrictionsData = (
      await expectJson(
        "GET /api/chatbox/restrictions before chatbox ingest",
        existingRestrictions,
        200,
        (data) => Array.isArray(data.restrictions),
      )
    ).data;
    console.log("Existing restrictions before ingest:", existingRestrictionsData.restrictions);
    for (const restriction of existingRestrictionsData.restrictions ?? []) {
      if (restriction.kind === "allowed_page") {
        const delRes = await request(base, jar, "DELETE", `/api/chatbox/restrictions/${restriction.id}`);
        await expectStatus(`DELETE /api/chatbox/restrictions/${restriction.id}`, delRes, 200);
        jar = delRes.jar;
      }
    }

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      domain: "fashionsis.com",
      country: "US",
      pageUrl: "https://fashionsis.com/support",
    });
    const createdChecked = await expectJson("POST /api/chatbox/sessions", created, 200, (data) =>
      Boolean(
        data.sessionId &&
          data.conversationId &&
          typeof data.visitorNickname === "string" &&
          Array.isArray(data.messages),
      ),
    );
    const { sessionId, conversationId: widgetConversationId } = createdChecked.data;

    const visitorText = `Public widget smoke ${Date.now()}`;
    const sent = await request(
      base,
      publicJar,
      "POST",
      `/api/chatbox/sessions/${sessionId}/messages`,
      { text: visitorText },
    );
    await expectJson(
      "POST /api/chatbox/sessions/[sessionId]/messages",
      sent,
      200,
      (data) =>
        Boolean(
          data.message?.from === "visitor" &&
            data.message?.text === visitorText &&
            data.conversation?.unread === 1,
        ),
    );

    const polled = await request(
      base,
      publicJar,
      "GET",
      `/api/chatbox/sessions/${sessionId}/messages?after=-1`,
    );
    await expectJson(
      "GET /api/chatbox/sessions/[sessionId]/messages",
      polled,
      200,
      (data) =>
        Boolean(
          data.messages?.some(
            (message) => message.from === "visitor" && message.text === visitorText,
          ),
        ),
    );

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for chatbox ingest",
      switched,
      200,
      (data) => data.workspace?.id === workspaceId,
    );
    jar = switchedChecked.jar;

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations after chatbox ingest", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === widgetConversationId);
      return Boolean(conversation && conversation.unread >= 1);
    });

    const detail = await request(base, jar, "GET", `/api/conversations/${widgetConversationId}`);
    await expectJson("GET /api/conversations/[id] chatbox ingest", detail, 200, (data) =>
      Boolean(
        data.messages?.some(
          (message) => message.from === "visitor" && message.text === visitorText,
        ),
      ),
    );

    const missingStream = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/sessions/missing-session-id/stream",
    );
    await expectStatus("GET /api/chatbox/sessions/[sessionId]/stream missing", missingStream, 404);

    const stream = await openChatboxStream(base, sessionId);
    try {
      await stream.waitFor((event) => event.type === "connected");

      const replyText = `Chatbox SSE smoke ${Date.now()}`;
      const operatorReply = await request(
        base,
        jar,
        "POST",
        `/api/conversations/${widgetConversationId}/messages`,
        { text: replyText },
      );
      await expectJson(
        "POST /api/conversations/[id]/messages chatbox SSE",
        operatorReply,
        200,
        (data) => Boolean(data.message?.from === "operator" && data.message?.text === replyText),
      );

      await stream.waitFor(
        (event) =>
          event.type === "messages" &&
          event.messages.some(
            (message) => message.from === "operator" && message.text === replyText,
          ),
      );
    } finally {
      await stream.close();
    }

    const resumed = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      sessionId,
    });
    await expectJson("POST /api/chatbox/sessions resume", resumed, 200, (data) =>
      Boolean(
        data.sessionId === sessionId &&
          data.conversationId === widgetConversationId &&
          data.messages?.some(
            (message) => message.from === "visitor" && message.text === visitorText,
          ),
      ),
    );

    const restore = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: homeWorkspaceId,
    });
    const restored = await expectJson(
      "POST /api/auth/workspace after chatbox ingest",
      restore,
      200,
      (data) => data.workspace?.id === homeWorkspaceId,
    );
    jar = restored.jar;
  });

  await step("chatbox embed script", async () => {
    const publicJar = new Map();

    const embedPublic = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/embed?domain=fashionsis.com",
    );
    const embedPublicChecked = await expectJson(
      "GET /api/chatbox/embed by domain",
      embedPublic,
      200,
      (data) =>
        Boolean(
          data.websiteId &&
            data.domain === "fashionsis.com" &&
            data.scriptUrl?.endsWith("/embed.js") &&
            data.widgetUrl?.includes("embed=1") &&
            data.htmlSnippet?.includes("BYBELT_CHAT") &&
            data.htmlSnippet?.includes(data.websiteId),
        ),
    );

    const embedAuth = await request(base, jar, "GET", "/api/chatbox/embed");
    await expectJson("GET /api/chatbox/embed authenticated", embedAuth, 200, (data) =>
      Boolean(data.websiteId && data.htmlSnippet?.includes("/embed.js")),
    );

    const embedMissing = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/embed?domain=missing.example",
    );
    await expectStatus("GET /api/chatbox/embed missing workspace", embedMissing, 404);

    const loader = await fetch(`${base}/embed.js`);
    await expectStatus("GET /embed.js", { response: loader }, 200);
    const loaderText = await loader.text();
    if (!loaderText.includes("BYBELT_CHAT") || !loaderText.includes("bybelt-chatbox-root")) {
      throw new Error("GET /embed.js missing expected loader markers");
    }

    const widgetUrl = embedPublicChecked.data.widgetUrl;
    const widgetPage = await fetch(widgetUrl);
    await expectStatus("GET /widget?embed=1", { response: widgetPage }, 200);
  });

  await step("chatbox typing indicators", async () => {
    const publicJar = new Map();
    const sessionBefore = await request(base, jar, "GET", "/api/auth/session");
    const beforeChecked = await expectJson(
      "GET /api/auth/session before typing",
      sessionBefore,
      200,
      (data) => Boolean(data.workspace?.id),
    );
    const homeWorkspaceId = beforeChecked.data.workspace.id;

    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson("GET /api/chatbox/config for typing", config, 200, (data) =>
      Boolean(data.workspaceId),
    );
    const workspaceId = configChecked.data.workspaceId;

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      country: "US",
    });
    const createdChecked = await expectJson("POST /api/chatbox/sessions for typing", created, 200, (data) =>
      Boolean(data.sessionId && data.conversationId),
    );
    const sessionId = createdChecked.data.sessionId;
    const conversationId = createdChecked.data.conversationId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for typing",
      switched,
      200,
      (data) => data.workspace?.id === workspaceId,
    );
    jar = switchedChecked.jar;

    const chatboxStream = await openChatboxStream(base, sessionId);
    const inboxStream = await openInboxStream(base, jar, conversationId);
    try {
      await chatboxStream.waitFor((event) => event.type === "connected");
      await inboxStream.waitFor((event) => event.type === "connected");

      const operatorTyping = await request(
        base,
        jar,
        "POST",
        `/api/conversations/${conversationId}/typing`,
        { typing: true },
      );
      await expectJson("POST /api/conversations/[id]/typing", operatorTyping, 200, (data) =>
        Boolean(data.ok),
      );

      await chatboxStream.waitFor(
        (event) =>
          event.type === "typing" &&
          event.from === "operator" &&
          event.typing === true &&
          event.conversationId === conversationId,
      );

      const visitorTyping = await request(
        base,
        publicJar,
        "POST",
        `/api/chatbox/sessions/${sessionId}/typing`,
        { typing: true },
      );
      await expectJson("POST /api/chatbox/sessions/[sessionId]/typing", visitorTyping, 200, (data) =>
        Boolean(data.ok),
      );

      await inboxStream.waitFor(
        (event) =>
          event.type === "typing" &&
          event.from === "visitor" &&
          event.typing === true &&
          event.conversationId === conversationId,
      );

      await request(base, jar, "POST", `/api/conversations/${conversationId}/typing`, {
        typing: false,
      });
      await request(base, publicJar, "POST", `/api/chatbox/sessions/${sessionId}/typing`, {
        typing: false,
      });
    } finally {
      await chatboxStream.close();
      await inboxStream.close();
    }

    const restore = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: homeWorkspaceId,
    });
    const restored = await expectJson(
      "POST /api/auth/workspace after typing",
      restore,
      200,
      (data) => data.workspace?.id === homeWorkspaceId,
    );
    jar = restored.jar;
  });

  await step("message receipts", async () => {
    const publicJar = new Map();
    const sessionBefore = await request(base, jar, "GET", "/api/auth/session");
    const beforeChecked = await expectJson(
      "GET /api/auth/session before receipts",
      sessionBefore,
      200,
      (data) => Boolean(data.workspace?.id),
    );
    const homeWorkspaceId = beforeChecked.data.workspace.id;

    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson("GET /api/chatbox/config for receipts", config, 200, (data) =>
      Boolean(data.workspaceId),
    );
    const workspaceId = configChecked.data.workspaceId;

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      country: "US",
    });
    const createdChecked = await expectJson("POST /api/chatbox/sessions for receipts", created, 200, (data) =>
      Boolean(data.sessionId && data.conversationId),
    );
    const sessionId = createdChecked.data.sessionId;
    const widgetConversationId = createdChecked.data.conversationId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for receipts",
      switched,
      200,
      (data) => data.workspace?.id === workspaceId,
    );
    jar = switchedChecked.jar;

    const visitorText = `Receipt smoke visitor ${Date.now()}`;
    const visitorPost = await request(
      base,
      publicJar,
      "POST",
      `/api/chatbox/sessions/${sessionId}/messages`,
      { text: visitorText },
    );
    const visitorChecked = await expectJson(
      "POST visitor message for receipts",
      visitorPost,
      200,
      (data) => Boolean(data.message?.from === "visitor" && data.message?.deliveredAt),
    );
    const visitorMessageId = visitorChecked.data.message.id;

    const chatboxStream = await openChatboxStream(base, sessionId);
    try {
      await chatboxStream.waitFor((event) => event.type === "connected");

      const markRead = await request(base, jar, "PATCH", `/api/conversations/${widgetConversationId}`, {
        unread: 0,
      });
      await expectJson("PATCH conversation unread for receipts", markRead, 200, (data) =>
        Boolean(data.conversation?.unread === 0),
      );

      await chatboxStream.waitFor(
        (event) =>
          event.type === "receipt" &&
          event.messageId === visitorMessageId &&
          Boolean(event.readAt),
      );
    } finally {
      await chatboxStream.close();
    }

    const inboxStream = await openInboxStream(base, jar, widgetConversationId);
    try {
      await inboxStream.waitFor((event) => event.type === "connected");

      const replyText = `Receipt smoke operator ${Date.now()}`;
      const operatorReply = await request(
        base,
        jar,
        "POST",
        `/api/conversations/${widgetConversationId}/messages`,
        { text: replyText },
      );
      const operatorChecked = await expectJson(
        "POST operator message for receipts",
        operatorReply,
        200,
        (data) => Boolean(data.message?.from === "operator" && data.message?.text === replyText),
      );
      const operatorMessageId = operatorChecked.data.message.id;

      const delivered = await request(
        base,
        publicJar,
        "POST",
        `/api/chatbox/sessions/${sessionId}/messages/${operatorMessageId}/receipt`,
        { status: "delivered" },
      );
      await expectJson("POST operator delivered receipt", delivered, 200, (data) =>
        Boolean(data.message?.deliveredAt),
      );

      await inboxStream.waitFor(
        (event) =>
          event.type === "receipt" &&
          event.messageId === operatorMessageId &&
          Boolean(event.deliveredAt),
      );

      const read = await request(
        base,
        publicJar,
        "POST",
        `/api/chatbox/sessions/${sessionId}/messages/${operatorMessageId}/receipt`,
        { status: "read" },
      );
      await expectJson("POST operator read receipt", read, 200, (data) => Boolean(data.message?.readAt));

      await inboxStream.waitFor(
        (event) =>
          event.type === "receipt" &&
          event.messageId === operatorMessageId &&
          Boolean(event.readAt),
      );
    } finally {
      await inboxStream.close();
    }

    const restore = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: homeWorkspaceId,
    });
    const restored = await expectJson(
      "POST /api/auth/workspace after receipts",
      restore,
      200,
      (data) => data.workspace?.id === homeWorkspaceId,
    );
    jar = restored.jar;
  });

  await step("visitor message attachment", async () => {
    const publicJar = new Map();
    const sessionBefore = await request(base, jar, "GET", "/api/auth/session");
    const beforeChecked = await expectJson(
      "GET /api/auth/session before attachment",
      sessionBefore,
      200,
      (data) => Boolean(data.workspace?.id),
    );
    const homeWorkspaceId = beforeChecked.data.workspace.id;

    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson("GET /api/chatbox/config for attachment", config, 200, (data) =>
      Boolean(data.workspaceId),
    );
    const workspaceId = configChecked.data.workspaceId;

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      country: "US",
    });
    const createdChecked = await expectJson("POST /api/chatbox/sessions for attachment", created, 200, (data) =>
      Boolean(data.sessionId && data.conversationId),
    );
    const sessionId = createdChecked.data.sessionId;
    const widgetConversationId = createdChecked.data.conversationId;

    const form = new FormData();
    form.append("file", new Blob(["attachment smoke"], { type: "text/plain" }), "smoke.txt");

    const uploadResponse = await fetch(`${base}/api/chatbox/sessions/${sessionId}/messages`, {
      method: "POST",
      body: form,
    });
    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      throw new Error(`POST attachment upload expected 200, got ${uploadResponse.status}: ${text.slice(0, 200)}`);
    }
    const uploadData = await uploadResponse.json();
    if (!uploadData.message?.attachment?.url || uploadData.message.attachment.name !== "smoke.txt") {
      throw new Error("POST attachment upload missing attachment metadata");
    }

    const fileResponse = await fetch(`${base}${uploadData.message.attachment.url}`);
    await expectStatus("GET uploaded attachment file", { response: fileResponse }, 200);

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for attachment",
      switched,
      200,
      (data) => data.workspace?.id === workspaceId,
    );
    jar = switchedChecked.jar;

    const detail = await request(base, jar, "GET", `/api/conversations/${widgetConversationId}`);
    await expectJson("GET /api/conversations/[id] attachment", detail, 200, (data) =>
      Boolean(
        data.messages?.some(
          (message) =>
            message.from === "visitor" &&
            message.attachment?.name === "smoke.txt" &&
            message.attachment?.mime === "text/plain",
        ),
      ),
    );

    const restore = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: homeWorkspaceId,
    });
    const restored = await expectJson(
      "POST /api/auth/workspace after attachment",
      restore,
      200,
      (data) => data.workspace?.id === homeWorkspaceId,
    );
    jar = restored.jar;
  });

  await step("conversation assignment", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson("GET /api/auth/session for assignment", session, 200, (data) =>
      Boolean(data.user?.id),
    );
    const operatorId = sessionChecked.data.user.id;

    const assign = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      assignedOperatorId: operatorId,
    });
    await expectJson("PATCH /api/conversations/[id] assign operator", assign, 200, (data) =>
      data.conversation?.assignee?.id === operatorId,
    );

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] assignee", detail, 200, (data) =>
      data.conversation?.assignee?.id === operatorId,
    );

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations assignee", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === conversationId);
      return conversation?.assignee?.id === operatorId;
    });

    const invalid = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      assignedOperatorId: "not-a-workspace-member",
    });
    if (invalid.response.status !== 400) {
      throw new Error(
        `PATCH /api/conversations/[id] invalid assignee expected 400, got ${invalid.response.status}`,
      );
    }

    const cleared = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      assignedOperatorId: null,
    });
    await expectJson("PATCH /api/conversations/[id] clear assignee", cleared, 200, (data) =>
      data.conversation?.assignee === null,
    );
  });

  await step("bulk assignment", async () => {
    const list = await request(base, jar, "GET", "/api/conversations");
    const listChecked = await expectJson("GET /api/conversations for bulk assign", list, 200, (data) =>
      Boolean(Array.isArray(data.conversations) && data.conversations.length >= 2),
    );
    const targetIds = listChecked.data.conversations.slice(0, 2).map((item) => item.id);

    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson("GET /api/auth/session for bulk assign", session, 200, (data) =>
      Boolean(data.user?.id),
    );
    const operatorId = sessionChecked.data.user.id;

    const empty = await request(base, jar, "PATCH", "/api/conversations/bulk-assign", {
      conversationIds: [],
      assignedOperatorId: operatorId,
    });
    await expectStatus("PATCH /api/conversations/bulk-assign empty ids", empty, 400);

    const assigned = await request(base, jar, "PATCH", "/api/conversations/bulk-assign", {
      conversationIds: targetIds,
      assignedOperatorId: operatorId,
    });
    await expectJson("PATCH /api/conversations/bulk-assign", assigned, 200, (data) =>
      Boolean(
        data.updatedCount === 2 &&
          data.conversations?.length === 2 &&
          data.conversations.every((conversation) => conversation.assignee?.id === operatorId),
      ),
    );

    const afterList = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations after bulk assign", afterList, 200, (data) =>
      targetIds.every((id) => {
        const conversation = data.conversations?.find((item) => item.id === id);
        return conversation?.assignee?.id === operatorId;
      }),
    );

    const invalidOperator = await request(base, jar, "PATCH", "/api/conversations/bulk-assign", {
      conversationIds: targetIds,
      assignedOperatorId: "not-a-workspace-member",
    });
    await expectStatus(
      "PATCH /api/conversations/bulk-assign invalid operator",
      invalidOperator,
      400,
    );

    const missing = await request(base, jar, "PATCH", "/api/conversations/bulk-assign", {
      conversationIds: [...targetIds, "missing-conversation-id"],
      assignedOperatorId: operatorId,
    });
    await expectStatus("PATCH /api/conversations/bulk-assign missing conversation", missing, 404);

    const cleared = await request(base, jar, "PATCH", "/api/conversations/bulk-assign", {
      conversationIds: targetIds,
      assignedOperatorId: null,
    });
    await expectJson("PATCH /api/conversations/bulk-assign clear", cleared, 200, (data) =>
      Boolean(data.conversations?.every((conversation) => conversation.assignee === null)),
    );
  });

  await step("bulk assign dedupe", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson(
      "GET /api/auth/session for bulk assign dedupe",
      session,
      200,
      (data) => Boolean(data.user?.id),
    );
    const operatorId = sessionChecked.data.user.id;

    const list = await request(base, jar, "GET", "/api/conversations");
    const listChecked = await expectJson(
      "GET /api/conversations for bulk assign dedupe",
      list,
      200,
      (data) => Boolean(data.conversations?.length >= 1),
    );
    const conversationId = listChecked.data.conversations[0].id;

    const assigned = await request(base, jar, "PATCH", "/api/conversations/bulk-assign", {
      conversationIds: [conversationId, conversationId],
      assignedOperatorId: operatorId,
    });
    await expectJson("PATCH /api/conversations/bulk-assign dedupe ids", assigned, 200, (data) =>
      Boolean(
        data.updatedCount === 1 &&
          data.conversations?.length === 1 &&
          data.conversations[0]?.id === conversationId,
      ),
    );

    await request(base, jar, "PATCH", "/api/conversations/bulk-assign", {
      conversationIds: [conversationId],
      assignedOperatorId: null,
    });
  });

  await step("auto assign on reply", async () => {
    const ROUTING_SLUG = "inbox/routing";
    const ASSIGN_ON_RESPONSE_KEY = "0-0";

    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson("GET /api/auth/session for auto assign", session, 200, (data) =>
      Boolean(data.user?.id),
    );
    const operatorId = sessionChecked.data.user.id;

    const enabled = await request(base, jar, "PATCH", `/api/settings/${ROUTING_SLUG}`, {
      key: ASSIGN_ON_RESPONSE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/inbox/routing assign on response", enabled, 200, (data) =>
      Boolean(data.key === ASSIGN_ON_RESPONSE_KEY && data.on === true),
    );

    const replyText = `Auto assign smoke ${Date.now()}`;
    const sent = await request(base, jar, "POST", `/api/conversations/${conversationId}/messages`, {
      text: replyText,
    });
    await expectJson("POST /api/conversations/[id]/messages auto assign", sent, 200, (data) =>
      Boolean(data.message?.text === replyText && data.message.from === "operator"),
    );

    const assigned = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] auto assignee", assigned, 200, (data) =>
      data.conversation?.assignee?.id === operatorId,
    );

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations auto assignee", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === conversationId);
      return conversation?.assignee?.id === operatorId;
    });

    const disabled = await request(base, jar, "PATCH", `/api/settings/${ROUTING_SLUG}`, {
      key: ASSIGN_ON_RESPONSE_KEY,
      on: false,
    });
    await expectJson("PATCH /api/settings/inbox/routing disable assign on response", disabled, 200, (data) =>
      Boolean(data.key === ASSIGN_ON_RESPONSE_KEY && data.on === false),
    );

    const cleared = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      assignedOperatorId: null,
    });
    await expectJson("PATCH /api/conversations/[id] clear assignee before disabled send", cleared, 200, (data) =>
      data.conversation?.assignee === null,
    );

    const noAssign = await request(base, jar, "POST", `/api/conversations/${conversationId}/messages`, {
      text: `No auto assign ${Date.now()}`,
    });
    await expectJson("POST /api/conversations/[id]/messages without auto assign", noAssign, 200, (data) =>
      Boolean(data.message?.from === "operator"),
    );

    const stillUnassigned = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] still unassigned", stillUnassigned, 200, (data) =>
      data.conversation?.assignee === null,
    );
  });

  await step("assignee picker data", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson(
      "GET /api/auth/session assignee picker user",
      session,
      200,
      (data) => Boolean(data.user?.id && data.user?.avatarGradient),
    );
    const operatorId = sessionChecked.data.user.id;

    const operators = await request(base, jar, "GET", "/api/workspaces/operators");
    await expectJson("GET /api/workspaces/operators assignee picker", operators, 200, (data) =>
      Boolean(
        Array.isArray(data.operators) &&
          data.operators.length >= 1 &&
          data.operators.every(
            (operator) =>
              typeof operator.userId === "string" &&
              typeof operator.name === "string" &&
              typeof operator.avatarUrl === "string" &&
              typeof operator.self === "boolean" &&
              typeof operator.online === "boolean",
          ),
      ),
    );

    const assign = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      assignedOperatorId: operatorId,
    });
    await expectJson("PATCH /api/conversations/[id] assignee picker assign", assign, 200, (data) =>
      Boolean(
        data.conversation?.assignee?.id === operatorId &&
          typeof data.conversation?.assignee?.avatarGradient === "string" &&
          typeof data.conversation?.assignee?.name === "string",
      ),
    );

    const cleared = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      assignedOperatorId: null,
    });
    await expectJson("PATCH /api/conversations/[id] assignee picker clear", cleared, 200, (data) =>
      data.conversation?.assignee === null,
    );
  });

  await step("send message", async () => {
    const result = await request(base, jar, "POST", `/api/conversations/${conversationId}/messages`, {
      text: `API smoke ${Date.now()}`,
    });
    await expectJson("POST /api/conversations/[id]/messages", result, 200, (data) =>
      Boolean(data.message?.text && data.message.from === "operator"),
    );
  });

  await step("operator message attachment", async () => {
    const form = new FormData();
    form.append("file", new Blob(["operator attachment smoke"], { type: "text/plain" }), "operator-smoke.txt");

    const uploadResponse = await fetch(`${base}/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { Cookie: cookieHeader(jar) },
      body: form,
    });
    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      throw new Error(
        `POST operator attachment expected 200, got ${uploadResponse.status}: ${text.slice(0, 200)}`,
      );
    }
    const uploadData = await uploadResponse.json();
    if (
      !uploadData.message?.attachment?.url ||
      uploadData.message.attachment.name !== "operator-smoke.txt" ||
      uploadData.message.from !== "operator"
    ) {
      throw new Error("POST operator attachment missing attachment metadata");
    }

    const fileResponse = await fetch(`${base}${uploadData.message.attachment.url}`);
    await expectStatus("GET operator attachment file", { response: fileResponse }, 200);

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] operator attachment", detail, 200, (data) =>
      Boolean(
        data.messages?.some(
          (message) =>
            message.from === "operator" &&
            message.attachment?.name === "operator-smoke.txt",
        ),
      ),
    );
  });

  await step("chatbox allow files toggle", async () => {
    const ALLOW_FILES_TOGGLE = "2-0";
    const publicJar = new Map();

    const sessionBefore = await request(base, jar, "GET", "/api/auth/session");
    const beforeChecked = await expectJson(
      "GET /api/auth/session before allow files",
      sessionBefore,
      200,
      (data) => Boolean(data.workspace?.id),
    );
    const homeWorkspaceId = beforeChecked.data.workspace.id;

    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson("GET /api/chatbox/config allowFiles default", config, 200, (data) =>
      Boolean(data.workspaceId && data.allowFiles === true),
    );
    const workspaceId = configChecked.data.workspaceId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for allow files",
      switched,
      200,
      (data) => data.workspace?.id === workspaceId,
    );
    jar = switchedChecked.jar;

    const disabled = await request(base, jar, "PATCH", "/api/settings/chatbox/behavior", {
      key: ALLOW_FILES_TOGGLE,
      on: false,
    });
    await expectJson("PATCH /api/settings/chatbox/behavior disable files", disabled, 200, (data) =>
      Boolean(data.key === ALLOW_FILES_TOGGLE && data.on === false),
    );

    const configDisabled = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    await expectJson("GET /api/chatbox/config allowFiles disabled", configDisabled, 200, (data) =>
      Boolean(data.allowFiles === false),
    );

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      country: "US",
    });
    const createdChecked = await expectJson(
      "POST /api/chatbox/sessions for allow files",
      created,
      200,
      (data) => Boolean(data.sessionId),
    );
    const sessionId = createdChecked.data.sessionId;

    const form = new FormData();
    form.append("file", new Blob(["blocked upload"], { type: "text/plain" }), "blocked.txt");

    const blockedResponse = await fetch(`${base}/api/chatbox/sessions/${sessionId}/messages`, {
      method: "POST",
      body: form,
    });
    if (blockedResponse.status !== 403) {
      const text = await blockedResponse.text();
      throw new Error(
        `POST attachment with files disabled expected 403, got ${blockedResponse.status}: ${text.slice(0, 200)}`,
      );
    }

    const enabled = await request(base, jar, "PATCH", "/api/settings/chatbox/behavior", {
      key: ALLOW_FILES_TOGGLE,
      on: true,
    });
    await expectJson("PATCH /api/settings/chatbox/behavior enable files", enabled, 200, (data) =>
      Boolean(data.key === ALLOW_FILES_TOGGLE && data.on === true),
    );

    const configEnabled = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    await expectJson("GET /api/chatbox/config allowFiles re-enabled", configEnabled, 200, (data) =>
      Boolean(data.allowFiles === true),
    );

    const restore = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: homeWorkspaceId,
    });
    const restored = await expectJson(
      "POST /api/auth/workspace restore allow files",
      restore,
      200,
      (data) => data.workspace?.id === homeWorkspaceId,
    );
    jar = restored.jar;
  });

  await step("chatbox audio upload", async () => {
    const publicJar = new Map();
    const ALLOW_AUDIO_TOGGLE = "2-1";

    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson("GET /api/chatbox/config allowAudio default", config, 200, (data) =>
      Boolean(data.workspaceId && data.allowAudio === true),
    );
    const workspaceId = configChecked.data.workspaceId;

    const sessionBefore = await request(base, jar, "GET", "/api/auth/session");
    const homeWorkspaceId = (
      await expectJson("GET /api/auth/session before audio", sessionBefore, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    jar = (
      await expectJson("POST /api/auth/workspace for audio", switched, 200, (data) =>
        Boolean(data.workspace?.id === workspaceId),
      )
    ).jar;

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      country: "US",
    });
    const createdChecked = await expectJson(
      "POST /api/chatbox/sessions for audio",
      created,
      200,
      (data) => Boolean(data.sessionId),
    );
    const sessionId = createdChecked.data.sessionId;

    const form = new FormData();
    form.append(
      "file",
      new Blob(["fake-audio-bytes"], { type: "audio/webm" }),
      "recording.webm",
    );

    const uploadResponse = await fetch(`${base}/api/chatbox/sessions/${sessionId}/messages`, {
      method: "POST",
      body: form,
    });
    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      throw new Error(
        `POST audio upload expected 200, got ${uploadResponse.status}: ${text.slice(0, 200)}`,
      );
    }
    const uploadData = await uploadResponse.json();
    if (
      !uploadData.message?.attachment?.url ||
      uploadData.message.attachment.mime !== "audio/webm"
    ) {
      throw new Error("POST audio upload missing audio attachment metadata");
    }

    const disabled = await request(base, jar, "PATCH", "/api/settings/chatbox/behavior", {
      key: ALLOW_AUDIO_TOGGLE,
      on: false,
    });
    await expectJson("PATCH /api/settings/chatbox/behavior disable audio", disabled, 200, (data) =>
      Boolean(data.key === ALLOW_AUDIO_TOGGLE && data.on === false),
    );

    const blockedResponse = await fetch(`${base}/api/chatbox/sessions/${sessionId}/messages`, {
      method: "POST",
      body: form,
    });
    if (blockedResponse.status !== 403) {
      throw new Error(`POST audio with audio disabled expected 403, got ${blockedResponse.status}`);
    }

    await request(base, jar, "PATCH", "/api/settings/chatbox/behavior", {
      key: ALLOW_AUDIO_TOGGLE,
      on: true,
    });

    if (homeWorkspaceId !== workspaceId) {
      const restore = await request(base, jar, "POST", "/api/auth/workspace", {
        workspaceId: homeWorkspaceId,
      });
      jar = (
        await expectJson("POST /api/auth/workspace restore audio", restore, 200, (data) =>
          Boolean(data.workspace?.id === homeWorkspaceId),
        )
      ).jar;
    }
  });

  await step("chatbox attachment size limit", async () => {
    const publicJar = new Map();
    const SMALL_LIMIT = 262144;

    const sessionBefore = await request(base, jar, "GET", "/api/auth/session");
    const homeWorkspaceId = (
      await expectJson("GET /api/auth/session before attachment limit", sessionBefore, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson(
      "GET /api/chatbox/config for attachment limit",
      config,
      200,
      (data) => Boolean(data.workspaceId),
    );
    const workspaceId = configChecked.data.workspaceId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    jar = (
      await expectJson("POST /api/auth/workspace for attachment limit", switched, 200, (data) =>
        Boolean(data.workspace?.id === workspaceId),
      )
    ).jar;

    const limitPatch = await request(base, jar, "PATCH", "/api/settings/chatbox/attachments", {
      maxBytes: SMALL_LIMIT,
    });
    await expectJson("PATCH /api/settings/chatbox/attachments", limitPatch, 200, (data) =>
      Boolean(data.maxBytes === SMALL_LIMIT),
    );

    const configLimited = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    await expectJson("GET /api/chatbox/config maxAttachmentBytes", configLimited, 200, (data) =>
      Boolean(data.maxAttachmentBytes === SMALL_LIMIT),
    );

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      country: "US",
    });
    const sessionId = (
      await expectJson("POST /api/chatbox/sessions for size limit", created, 200, (data) =>
        Boolean(data.sessionId),
      )
    ).data.sessionId;

    const largeForm = new FormData();
    largeForm.append(
      "file",
      new Blob([new Uint8Array(SMALL_LIMIT + 1024)], { type: "text/plain" }),
      "too-large.txt",
    );

    const blockedResponse = await fetch(`${base}/api/chatbox/sessions/${sessionId}/messages`, {
      method: "POST",
      body: largeForm,
    });
    if (blockedResponse.status !== 400) {
      throw new Error(`POST oversized attachment expected 400, got ${blockedResponse.status}`);
    }

    await request(base, jar, "PATCH", "/api/settings/chatbox/attachments", {
      maxBytes: 5 * 1024 * 1024,
    });

    if (homeWorkspaceId !== workspaceId) {
      const restore = await request(base, jar, "POST", "/api/auth/workspace", {
        workspaceId: homeWorkspaceId,
      });
      jar = (
        await expectJson("POST /api/auth/workspace restore attachment limit", restore, 200, (data) =>
          Boolean(data.workspace?.id === homeWorkspaceId),
        )
      ).jar;
    }
  });

  await step("inbox counts api", async () => {
    const counts = await request(base, jar, "GET", "/api/inbox/counts");
    await expectJson("GET /api/inbox/counts", counts, 200, (data) =>
      Boolean(
        typeof data.mainInbox === "number" &&
          typeof data.getStarted === "number" &&
          typeof data.notificationCount === "string" &&
          typeof data.totalUnread === "number",
      ),
    );
  });

  await step("visitor live ping", async () => {
    const publicJar = new Map();
    const sessionBefore = await request(base, jar, "GET", "/api/auth/session");
    const homeWorkspaceId = (
      await expectJson("GET /api/auth/session before ping", sessionBefore, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const workspaceId = (
      await expectJson("GET /api/chatbox/config for ping", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      country: "US",
      pageUrl: "/pricing",
    });
    const sessionId = (
      await expectJson("POST /api/chatbox/sessions for ping", created, 200, (data) =>
        Boolean(data.sessionId),
      )
    ).data.sessionId;

    const ping = await request(base, publicJar, "POST", `/api/chatbox/sessions/${sessionId}/ping`, {
      pageUrl: "/live-smoke-page",
    });
    await expectJson("POST /api/chatbox/sessions/[id]/ping", ping, 200, (data) =>
      Boolean(data.ok === true && data.visitorId === sessionId),
    );

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    jar = (
      await expectJson("POST /api/auth/workspace for visitor ping", switched, 200, (data) =>
        Boolean(data.workspace?.id === workspaceId),
      )
    ).jar;

    const visitors = await request(base, jar, "GET", "/api/visitors");
    await expectJson("GET /api/visitors after ping", visitors, 200, (data) =>
      Boolean(
        data.visitors?.some(
          (visitor) =>
            visitor.id === sessionId &&
            visitor.isActive === true &&
            visitor.currentPage === "/live-smoke-page",
        ),
      ),
    );

    if (homeWorkspaceId !== workspaceId) {
      const restore = await request(base, jar, "POST", "/api/auth/workspace", {
        workspaceId: homeWorkspaceId,
      });
      jar = (
        await expectJson("POST /api/auth/workspace restore ping", restore, 200, (data) =>
          Boolean(data.workspace?.id === homeWorkspaceId),
        )
      ).jar;
    }
  });

  await step("webhook delivery", async () => {
    const received = [];
    const server = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          received.push(JSON.parse(body));
        } catch {
          received.push({ raw: body });
        }
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");
      });
    });

    const listenPort = await new Promise((resolve, reject) => {
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("Failed to bind webhook receiver"));
          return;
        }
        resolve(address.port);
      });
      server.on("error", reject);
    });

    const webhookUrl = `http://127.0.0.1:${listenPort}/hook`;
    const createdWebhook = await request(base, jar, "POST", "/api/workspaces/webhooks", {
      url: webhookUrl,
    });
    const webhookId = (
      await expectJson("POST /api/workspaces/webhooks for delivery", createdWebhook, 201, (data) =>
        Boolean(data.webhook?.id),
      )
    ).data.webhook.id;

    const messageText = `Webhook smoke ${Date.now()}`;
    const sent = await request(base, jar, "POST", `/api/conversations/${conversationId}/messages`, {
      text: messageText,
    });
    await expectJson("POST /api/conversations/[id]/messages for webhook", sent, 200, (data) =>
      Boolean(data.message?.text === messageText),
    );

    for (let attempt = 0; attempt < 20 && received.length === 0; attempt += 1) {
      await wait(100);
    }

    if (!received.some((payload) => payload.event === "message:operator")) {
      throw new Error("Webhook receiver did not get message:operator event");
    }

    await request(base, jar, "DELETE", `/api/workspaces/webhooks/${webhookId}`);
    await new Promise((resolve) => server.close(resolve));
  });

  await step("outbound email dispatch", async () => {
    const result = await request(base, jar, "POST", "/api/auth/forgot-password", {
      email: SEED_EMAIL,
    });
    await expectJson("POST /api/auth/forgot-password email dispatch", result, 200, (data) =>
      Boolean(data.ok && data.emailDispatched === true),
    );
  });

  await step("analytics chart series", async () => {
    const result = await request(base, jar, "GET", "/api/analytics");
    await expectJson("GET /api/analytics chart series", result, 200, (data) =>
      Array.isArray(data.conversationChart) &&
        data.conversationChart.length === 7 &&
        typeof data.periodLabel === "string" &&
        typeof data.periodStart === "string",
    );
  });

  await step("chatbox ask email config", async () => {
    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    await expectJson("GET /api/chatbox/config askEmail", config, 200, (data) =>
      Boolean(data.askEmail === true && data.forceIdentify === false),
    );
  });

  await step("create campaign", async () => {
    const created = await request(base, jar, "POST", "/api/campaigns", {
      name: `Smoke campaign ${Date.now()}`,
      type: "one-shot",
    });
    const checked = await expectJson("POST /api/campaigns", created, 201, (data) =>
      Boolean(data.campaign?.id && data.campaign?.name),
    );
    const list = await request(base, jar, "GET", "/api/campaigns");
    await expectJson("GET /api/campaigns after create", list, 200, (data) =>
      Boolean(data.campaigns?.some((item) => item.id === checked.data.campaign.id)),
    );
  });

  await step("create helpdesk article", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session for helpdesk plan", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;
    const upgraded = await ensureHelpdeskPlan(base, jar, workspaceId);
    jar = upgraded.jar;

    const title = `Smoke article ${Date.now()}`;
    const created = await request(base, jar, "POST", "/api/helpdesk", {
      title,
      status: "visible",
    });
    const checked = await expectJson("POST /api/helpdesk", created, 201, (data) =>
      Boolean(data.article?.id && data.article?.title === title),
    );
    const list = await request(base, jar, "GET", "/api/helpdesk");
    await expectJson("GET /api/helpdesk after create", list, 200, (data) =>
      Boolean(data.articles?.some((item) => item.id === checked.data.article.id)),
    );
  });

  await step("chatbox ask phone", async () => {
    const ASK_PHONE_TOGGLE = "1-1";
    const publicJar = new Map();

    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson(
      "GET /api/chatbox/config for ask phone",
      config,
      200,
      (data) => Boolean(data.workspaceId),
    );
    const workspaceId = configChecked.data.workspaceId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for ask phone",
      switched,
      200,
      (data) => data.workspace?.id === workspaceId,
    );
    jar = switchedChecked.jar;

    await request(base, jar, "PATCH", "/api/settings/chatbox/behavior", {
      key: ASK_PHONE_TOGGLE,
      on: true,
    });

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      country: "US",
    });
    const createdChecked = await expectJson(
      "POST /api/chatbox/sessions for ask phone",
      created,
      200,
      (data) => Boolean(data.sessionId && data.conversationId),
    );
    const sessionId = createdChecked.data.sessionId;

    const sent = await request(base, publicJar, "POST", `/api/chatbox/sessions/${sessionId}/messages`, {
      text: "Phone identity smoke",
      phone: "+16281234567",
    });
    await expectJson("POST /api/chatbox/sessions/[id]/messages phone", sent, 200, (data) =>
      Boolean(data.message?.text === "Phone identity smoke"),
    );

    await request(base, jar, "PATCH", "/api/settings/chatbox/behavior", {
      key: ASK_PHONE_TOGGLE,
      on: false,
    });
  });

  await step("chatbox force identify", async () => {
    const FORCE_IDENTIFY_TOGGLE = "1-2";
    const publicJar = new Map();

    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson(
      "GET /api/chatbox/config for force identify",
      config,
      200,
      (data) => Boolean(data.workspaceId),
    );
    const workspaceId = configChecked.data.workspaceId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for force identify",
      switched,
      200,
      (data) => data.workspace?.id === workspaceId,
    );
    jar = switchedChecked.jar;

    await request(base, jar, "PATCH", "/api/settings/chatbox/behavior", {
      key: FORCE_IDENTIFY_TOGGLE,
      on: true,
    });

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      country: "US",
    });
    const createdChecked = await expectJson(
      "POST /api/chatbox/sessions for force identify",
      created,
      200,
      (data) => Boolean(data.sessionId),
    );
    const sessionId = createdChecked.data.sessionId;

    const blocked = await request(
      base,
      publicJar,
      "POST",
      `/api/chatbox/sessions/${sessionId}/messages`,
      { text: "Should be blocked" },
    );
    if (blocked.response.status !== 403) {
      throw new Error(
        `POST /api/chatbox/sessions/[id]/messages force identify expected 403, got ${blocked.response.status}`,
      );
    }

    const allowed = await request(
      base,
      publicJar,
      "POST",
      `/api/chatbox/sessions/${sessionId}/messages`,
      { text: "Identified visitor", email: "visitor-smoke@example.com" },
    );
    await expectJson(
      "POST /api/chatbox/sessions/[id]/messages identified",
      allowed,
      200,
      (data) => Boolean(data.message?.text === "Identified visitor"),
    );

    await request(base, jar, "PATCH", "/api/settings/chatbox/behavior", {
      key: FORCE_IDENTIFY_TOGGLE,
      on: false,
    });
  });

  await step("routing rule on session create", async () => {
    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson(
      "GET /api/chatbox/config for routing",
      config,
      200,
      (data) => Boolean(data.workspaceId),
    );
    const workspaceId = configChecked.data.workspaceId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for routing",
      switched,
      200,
      (data) => data.workspace?.id === workspaceId,
    );
    jar = switchedChecked.jar;

    await request(base, jar, "PATCH", "/api/settings/inbox/routing", {
      key: "1-0",
      on: true,
    });

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      country: "US",
      pageUrl: "https://example.com/pricing-plans",
    });
    const createdChecked = await expectJson(
      "POST /api/chatbox/sessions routing pageUrl",
      created,
      200,
      (data) => Boolean(data.sessionId && data.conversationId),
    );
    const conversationId = createdChecked.data.conversationId;

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] routing assignee", detail, 200, (data) =>
      Boolean(data.conversation?.assignee?.id),
    );
  });

  await step("email signature settings", async () => {
    const saved = await request(base, jar, "PATCH", "/api/settings/email/signature", {
      enabled: true,
      text: "FashionSis Support Team",
    });
    await expectJson("PATCH /api/settings/email/signature", saved, 200, (data) =>
      Boolean(data.enabled === true && data.text.includes("FashionSis")),
    );

    const loaded = await request(base, jar, "GET", "/api/settings/email/signature");
    await expectJson("GET /api/settings/email/signature", loaded, 200, (data) =>
      Boolean(data.enabled === true && data.text.includes("FashionSis")),
    );
  });

  await step("public helpdesk articles", async () => {
    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson(
      "GET /api/chatbox/config for public helpdesk",
      config,
      200,
      (data) => Boolean(data.workspaceId),
    );
    const workspaceId = configChecked.data.workspaceId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for public helpdesk",
      switched,
      200,
      (data) => data.workspace?.id === workspaceId,
    );
    jar = switchedChecked.jar;

    const planChecked = await ensureHelpdeskPlan(base, jar, workspaceId);
    jar = planChecked.jar;

    const title = `Public KB smoke ${Date.now()}`;
    const created = await request(base, jar, "POST", "/api/helpdesk", {
      title,
      status: "visible",
    });
    const checked = await expectJson("POST /api/helpdesk public article", created, 201, (data) =>
      Boolean(data.article?.id),
    );

    const listed = await request(
      base,
      publicJar,
      "GET",
      "/api/helpdesk/public?domain=fashionsis.com",
    );
    await expectJson("GET /api/helpdesk/public", listed, 200, (data) =>
      Boolean(
        Array.isArray(data.articles) &&
          data.articles.some((item) => item.id === checked.data.article.id),
      ),
    );

    if (homeWorkspaceId) {
      const restored = await request(base, jar, "POST", "/api/auth/workspace", {
        workspaceId: homeWorkspaceId,
      });
      const restoredChecked = await expectJson(
        "POST /api/auth/workspace restore after public helpdesk",
        restored,
        200,
        (data) => data.workspace?.id === homeWorkspaceId,
      );
      jar = restoredChecked.jar;
    }
  });

  await step("update delete campaign", async () => {
    const created = await request(base, jar, "POST", "/api/campaigns", {
      name: `Patch campaign ${Date.now()}`,
      type: "automated",
    });
    const createdChecked = await expectJson("POST /api/campaigns for patch", created, 201, (data) =>
      Boolean(data.campaign?.id),
    );
    const campaignId = createdChecked.data.campaign.id;

    const patched = await request(base, jar, "PATCH", `/api/campaigns/${campaignId}`, {
      name: "Patched campaign",
      status: "scheduled",
    });
    await expectJson("PATCH /api/campaigns/[id]", patched, 200, (data) =>
      Boolean(data.campaign?.name === "Patched campaign" && data.campaign?.status === "scheduled"),
    );

    const removed = await request(base, jar, "DELETE", `/api/campaigns/${campaignId}`);
    await expectJson("DELETE /api/campaigns/[id]", removed, 200, (data) =>
      Boolean(data.id === campaignId),
    );
  });

  await step("update delete helpdesk article", async () => {
    const created = await request(base, jar, "POST", "/api/helpdesk", {
      title: `Patch article ${Date.now()}`,
      status: "draft",
    });
    const createdChecked = await expectJson("POST /api/helpdesk for patch", created, 201, (data) =>
      Boolean(data.article?.id),
    );
    const articleId = createdChecked.data.article.id;

    const patched = await request(base, jar, "PATCH", `/api/helpdesk/${articleId}`, {
      title: "Patched article",
      body: "Article body smoke",
      status: "visible",
    });
    await expectJson("PATCH /api/helpdesk/[id]", patched, 200, (data) =>
      Boolean(data.article?.title === "Patched article" && data.article?.body === "Article body smoke"),
    );

    const removed = await request(base, jar, "DELETE", `/api/helpdesk/${articleId}`);
    await expectJson("DELETE /api/helpdesk/[id]", removed, 200, (data) =>
      Boolean(data.id === articleId),
    );
  });

  await step("helpdesk categories crud", async () => {
    const created = await request(base, jar, "POST", "/api/helpdesk/categories", {
      name: `Smoke category ${Date.now()}`,
    });
    const createdChecked = await expectJson("POST /api/helpdesk/categories", created, 201, (data) =>
      Boolean(data.category?.id),
    );
    const categoryId = createdChecked.data.category.id;

    const patched = await request(base, jar, "PATCH", `/api/helpdesk/categories/${categoryId}`, {
      name: "Patched category",
    });
    await expectJson("PATCH /api/helpdesk/categories/[id]", patched, 200, (data) =>
      Boolean(data.category?.name === "Patched category"),
    );

    const removed = await request(base, jar, "DELETE", `/api/helpdesk/categories/${categoryId}`);
    await expectJson("DELETE /api/helpdesk/categories/[id]", removed, 200, (data) =>
      Boolean(data.id === categoryId),
    );
  });

  await step("contacts crud", async () => {
    const created = await request(base, jar, "POST", "/api/contacts", {
      name: "Smoke Contact",
      email: `smoke-${Date.now()}@example.com`,
      company: "Smoke Co",
    });
    const createdChecked = await expectJson("POST /api/contacts", created, 201, (data) =>
      Boolean(data.contact?.id),
    );
    const contactId = createdChecked.data.contact.id;

    const patched = await request(base, jar, "PATCH", `/api/contacts/${contactId}`, {
      name: "Smoke Contact Updated",
    });
    await expectJson("PATCH /api/contacts/[id]", patched, 200, (data) =>
      Boolean(data.contact?.name === "Smoke Contact Updated"),
    );

    const removed = await request(base, jar, "DELETE", `/api/contacts/${contactId}`);
    await expectJson("DELETE /api/contacts/[id]", removed, 200, (data) =>
      Boolean(data.id === contactId),
    );
  });

  await step("public helpdesk article detail", async () => {
    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const workspaceId = (
      await expectJson("GET /api/chatbox/config public detail", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    jar = (
      await expectJson("POST /api/auth/workspace public detail", switched, 200, (data) =>
        Boolean(data.workspace?.id === workspaceId),
      )
    ).jar;

    const planChecked = await ensureHelpdeskPlan(base, jar, workspaceId);
    jar = planChecked.jar;

    const title = `Public detail ${Date.now()}`;
    const created = await request(base, jar, "POST", "/api/helpdesk", {
      title,
      status: "visible",
      body: "Public body",
    });
    const articleId = (
      await expectJson("POST /api/helpdesk for public detail", created, 201, (data) =>
        Boolean(data.article?.id),
      )
    ).data.article.id;

    const detail = await request(
      base,
      publicJar,
      "GET",
      `/api/helpdesk/public/${articleId}?domain=fashionsis.com`,
    );
    await expectJson("GET /api/helpdesk/public/[id]", detail, 200, (data) =>
      Boolean(data.article?.title === title && data.article?.views >= 1),
    );

    if (homeWorkspaceId) {
      const restored = await request(base, jar, "POST", "/api/auth/workspace", {
        workspaceId: homeWorkspaceId,
      });
      jar = (await expectJson("POST /api/auth/workspace restore public detail", restored, 200)).jar;
    }
  });

  await step("chatbox blocked page enforcement", async () => {
    const RESTRICTIONS_SLUG = "chatbox/restrictions";
    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const workspaceId = (
      await expectJson("GET /api/chatbox/config blocked page", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    jar = (
      await expectJson("POST /api/auth/workspace blocked page", switched, 200, (data) =>
        Boolean(data.workspace?.id === workspaceId),
      )
    ).jar;

    const blockedUrl = `https://blocked-smoke-${Date.now()}.example.com/page`;
    const added = await request(base, jar, "POST", "/api/chatbox/restrictions", {
      kind: "blocked_page",
      value: blockedUrl,
    });
    const restrictionId = (
      await expectJson("POST /api/chatbox/restrictions blocked page", added, 201, (data) =>
        Boolean(data.restriction?.id),
      )
    ).data.restriction.id;

    const blocked = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      pageUrl: blockedUrl,
    });
    if (blocked.response.status !== 403) {
      throw new Error(`Expected 403 for blocked page, got ${blocked.response.status}`);
    }

    await request(base, jar, "DELETE", `/api/chatbox/restrictions/${restrictionId}`);
    if (homeWorkspaceId) {
      const restored = await request(base, jar, "POST", "/api/auth/workspace", {
        workspaceId: homeWorkspaceId,
      });
      jar = (await expectJson("POST /api/auth/workspace restore blocked page", restored, 200)).jar;
    }
  });

  await step("chatbox vacation enforcement", async () => {
    const RESTRICTIONS_SLUG = "chatbox/restrictions";
    const VACATION_TOGGLE = "0-0";
    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const workspaceId = (
      await expectJson("GET /api/chatbox/config vacation", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    jar = (
      await expectJson("POST /api/auth/workspace vacation", switched, 200, (data) =>
        Boolean(data.workspace?.id === workspaceId),
      )
    ).jar;

    await request(base, jar, "PATCH", `/api/settings/${RESTRICTIONS_SLUG}`, {
      key: VACATION_TOGGLE,
      on: true,
    });

    const configHidden = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    await expectJson("GET /api/chatbox/config vacation hidden", configHidden, 200, (data) =>
      Boolean(data.chatboxVisible === false),
    );

    const blocked = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
    });
    if (blocked.response.status !== 403) {
      throw new Error(`Expected 403 for vacation, got ${blocked.response.status}`);
    }

    await request(base, jar, "PATCH", `/api/settings/${RESTRICTIONS_SLUG}`, {
      key: VACATION_TOGGLE,
      on: false,
    });
    if (homeWorkspaceId) {
      const restored = await request(base, jar, "POST", "/api/auth/workspace", {
        workspaceId: homeWorkspaceId,
      });
      jar = (await expectJson("POST /api/auth/workspace restore vacation", restored, 200)).jar;
    }
  });

  await step("patch chatbox restriction", async () => {
    const created = await request(base, jar, "POST", "/api/chatbox/restrictions", {
      kind: "blocked_ip",
      value: "192.168.1.10",
    });
    const restrictionId = (
      await expectJson("POST /api/chatbox/restrictions for patch", created, 201, (data) =>
        Boolean(data.restriction?.id),
      )
    ).data.restriction.id;

    const patched = await request(base, jar, "PATCH", `/api/chatbox/restrictions/${restrictionId}`, {
      value: "192.168.1.20",
    });
    await expectJson("PATCH /api/chatbox/restrictions/[id]", patched, 200, (data) =>
      Boolean(data.value === "192.168.1.20"),
    );

    await request(base, jar, "DELETE", `/api/chatbox/restrictions/${restrictionId}`);
  });

  await step("bulk conversation status", async () => {
    const list = await request(base, jar, "GET", "/api/conversations");
    const listChecked = await expectJson("GET /api/conversations for bulk status", list, 200, (data) =>
      Boolean(data.conversations?.length >= 1),
    );
    const ids = listChecked.data.conversations.slice(0, 2).map((item) => item.id);

    const patched = await request(base, jar, "PATCH", "/api/conversations/bulk-status", {
      conversationIds: ids,
      status: "pending",
    });
    await expectJson("PATCH /api/conversations/bulk-status", patched, 200, (data) =>
      Boolean(
        Array.isArray(data.conversations) &&
          data.conversations.every((item) => item.status === "pending"),
      ),
    );
  });

  await step("sub-inbox conversation filter", async () => {
    const subInboxes = await request(base, jar, "GET", "/api/sub-inboxes");
    const subInboxesChecked = await expectJson("GET /api/sub-inboxes for filter", subInboxes, 200, (data) =>
      Boolean(data.subInboxes?.length >= 1),
    );
    const subInboxId = subInboxesChecked.data.subInboxes[0]?.id;
    if (!subInboxId) throw new Error("No sub-inbox available");

    const filtered = await request(
      base,
      jar,
      "GET",
      `/api/conversations?subInboxId=${encodeURIComponent(subInboxId)}`,
    );
    await expectJson("GET /api/conversations?subInboxId", filtered, 200, (data) =>
      Array.isArray(data.conversations),
    );
  });

  await step("delete conversation", async () => {
    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const workspaceId = (
      await expectJson("GET /api/chatbox/config delete conversation", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
    });
    const tempConversationId = (
      await expectJson("POST /api/chatbox/sessions for delete", created, 200, (data) =>
        Boolean(data.conversationId),
      )
    ).data.conversationId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    jar = (
      await expectJson("POST /api/auth/workspace delete conversation", switched, 200, (data) =>
        Boolean(data.workspace?.id === workspaceId),
      )
    ).jar;

    const removed = await request(base, jar, "DELETE", `/api/conversations/${tempConversationId}`);
    await expectJson("DELETE /api/conversations/[id]", removed, 200, (data) =>
      Boolean(data.id === tempConversationId),
    );

    if (homeWorkspaceId) {
      const restored = await request(base, jar, "POST", "/api/auth/workspace", {
        workspaceId: homeWorkspaceId,
      });
      jar = (await expectJson("POST /api/auth/workspace restore delete conversation", restored, 200))
        .jar;
    }
  });

  await step("spam conversation filter", async () => {
    await request(base, jar, "POST", `/api/conversations/${conversationId}/segments`, {
      segment: "spam",
    });

    const spamList = await request(base, jar, "GET", "/api/conversations?segment=spam");
    await expectJson("GET /api/conversations?segment=spam", spamList, 200, (data) =>
      Boolean(data.conversations?.some((item) => item.id === conversationId)),
    );

    const counts = await request(base, jar, "GET", "/api/inbox/counts");
    await expectJson("GET /api/inbox/counts spam", counts, 200, (data) =>
      typeof data.spam === "number",
    );
  });

  await step("patch chatbox session identity", async () => {
    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const workspaceId = (
      await expectJson("GET /api/chatbox/config session patch", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", { workspaceId });
    const sessionId = (
      await expectJson("POST /api/chatbox/sessions for patch identity", created, 200, (data) =>
        Boolean(data.sessionId),
      )
    ).data.sessionId;

    const patched = await request(base, publicJar, "PATCH", `/api/chatbox/sessions/${sessionId}`, {
      email: "patch-identity@example.com",
      phone: "+15551234567",
    });
    await expectJson("PATCH /api/chatbox/sessions/[id]", patched, 200, (data) =>
      Boolean(data.email === "patch-identity@example.com" && data.phone === "+15551234567"),
    );
  });

  await step("webhook note delivery", async () => {
    const { createServer } = await import("node:http");
    const listenPort = await getFreePort();
    const received = [];

    const server = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          received.push(JSON.parse(body));
        } catch {
          received.push({ raw: body });
        }
        res.writeHead(200);
        res.end("ok");
      });
    });

    await new Promise((resolve, reject) => {
      server.listen(listenPort, "127.0.0.1", () => resolve(undefined));
      server.on("error", reject);
    });

    const webhookUrl = `http://127.0.0.1:${listenPort}/hook`;
    const createdWebhook = await request(base, jar, "POST", "/api/workspaces/webhooks", {
      url: webhookUrl,
    });
    const webhookId = (
      await expectJson("POST /api/workspaces/webhooks for note", createdWebhook, 201, (data) =>
        Boolean(data.webhook?.id),
      )
    ).data.webhook.id;

    const noteText = `Webhook note ${Date.now()}`;
    await request(base, jar, "POST", `/api/conversations/${conversationId}/notes`, {
      text: noteText,
    });

    for (let attempt = 0; attempt < 20 && received.length === 0; attempt += 1) {
      await wait(100);
    }

    if (!received.some((payload) => payload.event === "message:note")) {
      throw new Error("Webhook receiver did not get message:note event");
    }

    await request(base, jar, "DELETE", `/api/workspaces/webhooks/${webhookId}`);
    await new Promise((resolve) => server.close(resolve));
  });

  await step("operator invite audit log", async () => {
    await request(base, jar, "PATCH", "/api/workspaces/data/limits", {
      key: "operators",
      limit: 10,
    });

    const before = await request(base, jar, "GET", "/api/workspaces/transparency");
    const beforeCount = (
      await expectJson("GET /api/workspaces/transparency before invite", before, 200, (data) =>
        Array.isArray(data.logs),
      )
    ).data.logs.length;

    const invite = await request(base, jar, "POST", "/api/workspaces/operators", {
      email: SEED_OPERATOR2_EMAIL,
    });
    if (invite.response.status !== 409 && invite.response.status !== 201) {
      throw new Error(`Unexpected invite status ${invite.response.status}`);
    }

    const after = await request(base, jar, "GET", "/api/workspaces/transparency");
    const afterChecked = await expectJson(
      "GET /api/workspaces/transparency after invite",
      after,
      200,
      (data) => Array.isArray(data.logs),
    );
    if (invite.response.status === 201 && afterChecked.data.logs.length <= beforeCount) {
      throw new Error("Expected audit log entry after operator invite");
    }
  });

  await step("conversation rating", async () => {
    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const workspaceId = (
      await expectJson("GET /api/chatbox/config rating", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", { workspaceId });
    const sessionId = (
      await expectJson("POST /api/chatbox/sessions for rating", created, 200, (data) =>
        Boolean(data.sessionId),
      )
    ).data.sessionId;

    const rated = await request(base, publicJar, "POST", `/api/chatbox/sessions/${sessionId}/rate`, {
      score: 5,
    });
    await expectJson("POST /api/chatbox/sessions/[id]/rate", rated, 200, (data) =>
      Boolean(data.ok && data.score === 5),
    );

    const switched = await request(base, jar, "POST", "/api/auth/workspace", { workspaceId });
    jar = (
      await expectJson("POST /api/auth/workspace rating", switched, 200, (data) =>
        Boolean(data.workspace?.id === workspaceId),
      )
    ).jar;

    const analytics = await request(base, jar, "GET", "/api/analytics");
    await expectJson("GET /api/analytics rating", analytics, 200, (data) =>
      typeof data.visitorChart === "object" && Array.isArray(data.visitorChart),
    );

    if (homeWorkspaceId) {
      const restored = await request(base, jar, "POST", "/api/auth/workspace", {
        workspaceId: homeWorkspaceId,
      });
      jar = (await expectJson("POST /api/auth/workspace restore rating", restored, 200)).jar;
    }
  });

  await step("search helpdesk and campaigns", async () => {
    const result = await request(base, jar, "GET", "/api/search?q=smoke");
    await expectJson("GET /api/search extended", result, 200, (data) =>
      Array.isArray(data.campaigns) && Array.isArray(data.helpdesk),
    );
  });

  await step("billing plan upgrade", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session for billing", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const upgraded = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Essentials",
    });
    await expectJson("PATCH /api/billing/plans", upgraded, 200, (data) =>
      Boolean(data.plan?.planTag === "Essentials"),
    );

    const restored = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Free",
    });
    await expectJson("PATCH /api/billing/plans restore", restored, 200, (data) =>
      Boolean(data.plan?.planTag === "Free"),
    );

    const plusRestore = await ensureHelpdeskPlan(base, jar, workspaceId);
    jar = plusRestore.jar;
  });

  await step("campaign templates recipients send", async () => {
    const templateRes = await request(base, jar, "POST", "/api/campaigns/templates", {
      name: `Smoke template ${Date.now()}`,
      category: "yours",
    });
    const template = (
      await expectJson("POST /api/campaigns/templates", templateRes, 201, (data) =>
        Boolean(data.template?.id),
      )
    ).data.template;

    const campaignRes = await request(base, jar, "POST", "/api/campaigns", {
      name: `Smoke send ${Date.now()}`,
      type: "one-shot",
    });
    const campaign = (
      await expectJson("POST /api/campaigns for send", campaignRes, 201, (data) =>
        Boolean(data.campaign?.id),
      )
    ).data.campaign;

    const detail = await request(base, jar, "GET", `/api/campaigns/${campaign.id}`);
    await expectJson("GET /api/campaigns/[id]", detail, 200, (data) =>
      Boolean(data.campaign?.id === campaign.id),
    );

    const contactsRes = await request(base, jar, "GET", "/api/contacts");
    const contactId = (
      await expectJson("GET /api/contacts for campaign", contactsRes, 200, (data) =>
        Boolean(data.contacts?.[0]?.id),
      )
    ).data.contacts[0].id;

    const recipients = await request(base, jar, "POST", `/api/campaigns/${campaign.id}/recipients`, {
      contactIds: [contactId],
    });
    await expectJson("POST /api/campaigns/[id]/recipients", recipients, 200, (data) =>
      data.contactCount >= 1,
    );

    const sent = await request(base, jar, "POST", `/api/campaigns/${campaign.id}/send`);
    await expectJson("POST /api/campaigns/[id]/send", sent, 200, (data) =>
      Boolean(data.campaign?.status === "sent" && typeof data.emailsDispatched === "number"),
    );

    const deletedTemplate = await request(base, jar, "DELETE", `/api/campaigns/templates/${template.id}`);
    await expectJson("DELETE /api/campaigns/templates/[id]", deletedTemplate, 200);
  });

  await step("analytics timezone and rating chart", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session analytics", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const upgraded = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Essentials",
    });
    await expectJson("PATCH /api/billing/plans analytics", upgraded, 200);

    const tz = await request(base, jar, "PATCH", "/api/workspaces/analytics", {
      timezone: "America/New_York",
    });
    await expectJson("PATCH /api/workspaces/analytics", tz, 200, (data) =>
      data.timezone === "America/New_York",
    );

    const analytics = await request(base, jar, "GET", "/api/analytics");
    await expectJson("GET /api/analytics ratingChart", analytics, 200, (data) =>
      data.analyticsEnabled === true && Array.isArray(data.ratingChart),
    );

    const ratings = await request(base, jar, "GET", "/api/analytics/ratings");
    await expectJson("GET /api/analytics/ratings", ratings, 200, (data) =>
      Array.isArray(data.ratings),
    );

    const restored = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Free",
    });
    await expectJson("PATCH /api/billing/plans restore analytics", restored, 200);
  });

  await step("helpdesk contact detail and helpful", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const homeWorkspaceId = (
      await expectJson("GET /api/auth/session helpful", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const fashionsisId = (
      await expectJson("GET /api/chatbox/config helpful", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: fashionsisId,
    });
    jar = (
      await expectJson("POST /api/auth/workspace helpful", switched, 200, (data) =>
        Boolean(data.workspace?.id === fashionsisId),
      )
    ).jar;

    const planChecked = await ensureHelpdeskPlan(base, jar, fashionsisId);
    jar = planChecked.jar;

    const articleRes = await request(base, jar, "POST", "/api/helpdesk", {
      title: `Detail smoke ${Date.now()}`,
      status: "visible",
      body: "Smoke body",
    });
    const article = (
      await expectJson("POST /api/helpdesk detail", articleRes, 201, (data) =>
        Boolean(data.article?.id),
      )
    ).data.article;

    const articleDetail = await request(base, jar, "GET", `/api/helpdesk/${article.id}`);
    await expectJson("GET /api/helpdesk/[id]", articleDetail, 200, (data) =>
      Boolean(data.article?.title === article.title),
    );

    const contactRes = await request(base, jar, "POST", "/api/contacts", {
      name: `Detail contact ${Date.now()}`,
      email: `detail-${Date.now()}@smoke.test`,
    });
    const contact = (
      await expectJson("POST /api/contacts detail", contactRes, 201, (data) =>
        Boolean(data.contact?.id),
      )
    ).data.contact;

    const contactDetail = await request(base, jar, "GET", `/api/contacts/${contact.id}`);
    await expectJson("GET /api/contacts/[id]", contactDetail, 200, (data) =>
      Boolean(data.contact?.email === contact.email),
    );

    const segmentList = await request(base, jar, "GET", "/api/contacts?segment=chat");
    await expectJson("GET /api/contacts segment", segmentList, 200, (data) =>
      Array.isArray(data.contacts),
    );

    const helpful = await request(
      base,
      jar,
      "POST",
      `/api/helpdesk/public/${article.id}/helpful?domain=fashionsis.com`,
    );
    await expectJson("POST /api/helpdesk/public/[id]/helpful", helpful, 200, (data) =>
      typeof data.helpfulCount === "number" && data.helpfulCount >= 1,
    );

    if (homeWorkspaceId) {
      const restored = await request(base, jar, "POST", "/api/auth/workspace", {
        workspaceId: homeWorkspaceId,
      });
      jar = (await expectJson("POST /api/auth/workspace restore helpful", restored, 200)).jar;
    }
  });

  await step("chatbox runtime restrictions", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session domain lock", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    await request(base, jar, "PATCH", "/api/settings/chatbox/security", {
      key: "0-0",
      on: true,
    });

    const blocked = await request(base, jar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      domain: "evil.example",
      country: "US",
    });
    if (blocked.response.status !== 403) {
      throw new Error(
        `POST /api/chatbox/sessions domain lock expected 403, got ${blocked.response.status}`,
      );
    }

    await request(base, jar, "PATCH", "/api/settings/chatbox/security", {
      key: "0-0",
      on: false,
    });

    const config = await request(base, jar, "GET", "/api/chatbox/config?domain=fashionsis.com");
    await expectJson("GET /api/chatbox/config runtime", config, 200, (data) =>
      typeof data.chatboxVisible === "boolean",
    );
  });

  await step("bulk delete and webhook test", async () => {
    const webhookRes = await request(base, jar, "POST", "/api/workspaces/webhooks", {
      url: "https://example.com/webhooks/smoke-u158",
    });
    const webhook = (
      await expectJson("POST /api/workspaces/webhooks u158", webhookRes, 201, (data) =>
        Boolean(data.webhook?.id),
      )
    ).data.webhook;

    const test = await request(base, jar, "POST", `/api/workspaces/webhooks/${webhook.id}/test`);
    await expectJson("POST /api/workspaces/webhooks/[id]/test", test, 200, (data) =>
      Boolean(data.ok),
    );

    await request(base, jar, "DELETE", `/api/workspaces/webhooks/${webhook.id}`);
  });

  await step("operator role patch", async () => {
    const operators = await request(base, jar, "GET", "/api/workspaces/operators");
    const member = (
      await expectJson("GET /api/workspaces/operators role", operators, 200, (data) =>
        Boolean(data.operators?.length),
      )
    ).data.operators.find((op) => op.role === "member" && !op.isSelf);

    if (member) {
      const patched = await request(base, jar, "PATCH", `/api/workspaces/operators/${member.userId}`, {
        role: "member",
      });
      await expectJson("PATCH /api/workspaces/operators/[userId]", patched, 200, (data) =>
        Boolean(data.operator?.role === "member"),
      );
    }
  });

  await step("settings audit log", async () => {
    await request(base, jar, "PATCH", "/api/settings/inbox/routing", {
      key: "1-0",
      on: true,
    });

    const transparency = await request(base, jar, "GET", "/api/workspaces/transparency");
    await expectJson("GET /api/workspaces/transparency audit", transparency, 200, (data) =>
      Array.isArray(data.logs) && data.logs.some((log) => log.action?.includes("inbox/routing")),
    );
  });

  await step("oauth providers and helpdesk body", async () => {
    const providers = await request(base, jar, "GET", "/api/auth/providers");
    await expectJson("GET /api/auth/providers linked", providers, 200, (data) =>
      typeof data.google === "boolean" && typeof data.googleLinked === "boolean",
    );
  });

  await step("campaign recipients data and list", async () => {
    const campaignRes = await request(base, jar, "POST", "/api/campaigns", {
      name: `Recipients list ${Date.now()}`,
      type: "one-shot",
    });
    const campaign = (
      await expectJson("POST /api/campaigns recipients", campaignRes, 201, (data) =>
        Boolean(data.campaign?.id),
      )
    ).data.campaign;

    const contactsRes = await request(base, jar, "GET", "/api/contacts");
    const contactId = (
      await expectJson("GET /api/contacts for recipients list", contactsRes, 200, (data) =>
        Boolean(data.contacts?.[0]?.id),
      )
    ).data.contacts[0].id;

    await request(base, jar, "POST", `/api/campaigns/${campaign.id}/recipients`, {
      contactIds: [contactId],
    });

    const listed = await request(base, jar, "GET", `/api/campaigns/${campaign.id}/recipients`);
    await expectJson("GET /api/campaigns/[id]/recipients", listed, 200, (data) =>
      Array.isArray(data.recipients) && data.recipients.length >= 1,
    );

    const dataLimits = await request(base, jar, "GET", "/api/workspaces/data");
    await expectJson("GET /api/workspaces/data campaign used", dataLimits, 200, (data) => {
      const row = data.limits?.find((item) => item.key === "campaignRecipients");
      return Boolean(row && row.used >= 1);
    });
  });

  await step("search visitors and shortcuts", async () => {
    const bang = `!smokeu167${Date.now()}`;
    const shortcutRes = await request(base, jar, "POST", "/api/message-shortcuts", {
      bang,
      message: "Smoke shortcut message",
    });
    await expectJson("POST /api/message-shortcuts search", shortcutRes, 201, (data) =>
      Boolean(data.shortcut?.id),
    );

    const search = await request(base, jar, "GET", `/api/search?q=${encodeURIComponent(bang.slice(1))}`);
    await expectJson("GET /api/search shortcuts", search, 200, (data) =>
      Array.isArray(data.messageShortcuts) &&
      data.messageShortcuts.some((item) => item.title?.includes(bang.slice(1))),
    );

    const visitorSearch = await request(base, jar, "GET", "/api/search?q=visitor");
    await expectJson("GET /api/search visitors", visitorSearch, 200, (data) =>
      Array.isArray(data.visitors),
    );

    const visitorsFiltered = await request(base, jar, "GET", "/api/visitors?q=visitor");
    await expectJson("GET /api/visitors?q=", visitorsFiltered, 200, (data) =>
      Array.isArray(data.visitors),
    );
  });

  await step("transparency smtp and helpdesk gate", async () => {
    const before = await request(base, jar, "GET", "/api/workspaces/transparency");
    const beforeCount = (
      await expectJson("GET /api/workspaces/transparency before off", before, 200, (data) =>
        Array.isArray(data.logs),
      )
    ).data.logs.length;

    await request(base, jar, "PATCH", "/api/settings/workspace/transparency", {
      key: "0-0",
      on: false,
    });

    await request(base, jar, "PATCH", "/api/settings/chatbox/appearance", {
      key: "0-0",
      on: true,
    });

    const afterOff = await request(base, jar, "GET", "/api/workspaces/transparency");
    const afterOffCount = (
      await expectJson("GET /api/workspaces/transparency after off", afterOff, 200, (data) =>
        Array.isArray(data.logs),
      )
    ).data.logs.length;

    if (afterOffCount !== beforeCount) {
      throw new Error("Transparency toggle off should suppress audit logs");
    }

    await request(base, jar, "PATCH", "/api/settings/workspace/transparency", {
      key: "0-0",
      on: true,
    });

    await request(base, jar, "PATCH", "/api/settings/email/delivery", {
      key: "1-0",
      on: true,
    });

    const session = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session helpdesk gate", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const downgraded = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Free",
    });
    await expectJson("PATCH /api/billing/plans free gate", downgraded, 200);

    const blocked = await request(base, jar, "POST", "/api/helpdesk", {
      title: `Gate smoke ${Date.now()}`,
      status: "draft",
    });
    if (blocked.response.status !== 403) {
      throw new Error(
        `POST /api/helpdesk plan gate expected 403, got ${blocked.response.status}`,
      );
    }

    const upgraded = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Plus",
    });
    await expectJson("PATCH /api/billing/plans plus restore", upgraded, 200);

    const articleRes = await request(base, jar, "POST", "/api/helpdesk", {
      title: `Body smoke ${Date.now()}`,
      status: "draft",
      body: "Article body content",
    });
    const article = (
      await expectJson("POST /api/helpdesk with body", articleRes, 201, (data) =>
        Boolean(data.article?.id),
      )
    ).data.article;

    const detail = await request(base, jar, "GET", `/api/helpdesk/${article.id}`);
    await expectJson("GET /api/helpdesk/[id] body", detail, 200, (data) =>
      data.article?.body === "Article body content",
    );

    await request(base, jar, "PATCH", "/api/settings/email/delivery", {
      key: "1-0",
      on: false,
    });
  });

  await step("batch u173 u182 integrations", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session u173 batch", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const search = await request(base, jar, "GET", "/api/search?q=campaign");
    await expectJson("GET /api/search extended buckets", search, 200, (data) =>
      Array.isArray(data.campaigns) &&
      Array.isArray(data.helpdesk) &&
      Array.isArray(data.visitors) &&
      Array.isArray(data.messageShortcuts),
    );

    const conversations = await request(base, jar, "GET", "/api/conversations?q=visitor");
    await expectJson("GET /api/conversations?q=", conversations, 200, (data) =>
      Array.isArray(data.conversations),
    );

    const smtpSaved = await request(base, jar, "PATCH", "/api/settings/email/delivery", {
      key: "smtpHost",
      value: "smtp.smoke.test",
    });
    await expectJson("PATCH /api/settings/email/delivery smtpHost", smtpSaved, 200, (data) =>
      data.key === "smtpHost" && data.value === "smtp.smoke.test",
    );

    const smtpLoaded = await request(base, jar, "GET", "/api/settings/email/delivery");
    await expectJson("GET /api/settings/email/delivery fields", smtpLoaded, 200, (data) =>
      data.fields?.smtpHost === "smtp.smoke.test",
    );

    await ensureHelpdeskPlan(base, jar, workspaceId);

    const categoryRes = await request(base, jar, "POST", "/api/helpdesk/categories", {
      name: `Detail category ${Date.now()}`,
    });
    const category = (
      await expectJson("POST /api/helpdesk/categories detail", categoryRes, 201, (data) =>
        Boolean(data.category?.id),
      )
    ).data.category;

    const categoryDetail = await request(
      base,
      jar,
      "GET",
      `/api/helpdesk/categories/${category.id}`,
    );
    await expectJson("GET /api/helpdesk/categories/[id]", categoryDetail, 200, (data) =>
      data.category?.name === category.name,
    );

    const downgraded = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Free",
    });
    await expectJson("PATCH /api/billing/plans free u173", downgraded, 200);

    const blockedCategory = await request(base, jar, "POST", "/api/helpdesk/categories", {
      name: `Gate category ${Date.now()}`,
    });
    if (blockedCategory.response.status !== 403) {
      throw new Error(
        `POST /api/helpdesk/categories plan gate expected 403, got ${blockedCategory.response.status}`,
      );
    }

    const blockedAnalytics = await request(base, jar, "PATCH", "/api/workspaces/analytics", {
      timezone: "Europe/Paris",
    });
    if (blockedAnalytics.response.status !== 403) {
      throw new Error(
        `PATCH /api/workspaces/analytics plan gate expected 403, got ${blockedAnalytics.response.status}`,
      );
    }

    const upgraded = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Plus",
    });
    await expectJson("PATCH /api/billing/plans plus u173 restore", upgraded, 200);
  });

  await step("batch u183 u192 integrations", async () => {
    const helpdeskSearch = await request(base, jar, "GET", "/api/helpdesk?q=article");
    await expectJson("GET /api/helpdesk?q=", helpdeskSearch, 200, (data) =>
      Array.isArray(data.articles),
    );

    const contactsRes = await request(base, jar, "GET", "/api/contacts");
    const contactId = (
      await expectJson("GET /api/contacts for campaign contactIds", contactsRes, 200, (data) =>
        Boolean(data.contacts?.[0]?.id),
      )
    ).data.contacts[0].id;

    const contactDetail = await request(base, jar, "GET", `/api/contacts/${contactId}`);
    await expectJson("GET /api/contacts/[id]", contactDetail, 200, (data) =>
      data.contact?.id === contactId,
    );

    const campaignRes = await request(base, jar, "POST", "/api/campaigns", {
      name: `Smoke contactIds ${Date.now()}`,
      type: "one-shot",
      contactIds: [contactId],
    });
    await expectJson("POST /api/campaigns contactIds", campaignRes, 201, (data) =>
      data.campaign?.contactCount >= 1,
    );

    const convSearch = await request(base, jar, "GET", "/api/conversations?q=visitor");
    await expectJson("GET /api/conversations?q= inbox filter", convSearch, 200, (data) =>
      Array.isArray(data.conversations),
    );

    const plus = await ensureHelpdeskPlan(base, jar, (
      await expectJson(
        "GET /api/auth/session u183",
        await request(base, jar, "GET", "/api/auth/session"),
        200,
        (data) => Boolean(data.workspace?.id),
      )
    ).data.workspace.id);

    jar = plus.jar;

    const articleRes = await request(base, jar, "POST", "/api/helpdesk", {
      title: `Smoke delete ${Date.now()}`,
      status: "draft",
    });
    const article = (
      await expectJson("POST /api/helpdesk delete target", articleRes, 201, (data) =>
        Boolean(data.article?.id),
      )
    ).data.article;

    const deletedArticle = await request(base, jar, "DELETE", `/api/helpdesk/${article.id}`);
    await expectJson("DELETE /api/helpdesk/[id]", deletedArticle, 200);

    const campaignDeleteRes = await request(base, jar, "POST", "/api/campaigns", {
      name: `Smoke delete campaign ${Date.now()}`,
      type: "one-shot",
    });
    const deleteCampaign = (
      await expectJson("POST /api/campaigns delete target", campaignDeleteRes, 201, (data) =>
        Boolean(data.campaign?.id),
      )
    ).data.campaign;

    const deletedCampaign = await request(
      base,
      jar,
      "DELETE",
      `/api/campaigns/${deleteCampaign.id}`,
    );
    await expectJson("DELETE /api/campaigns/[id]", deletedCampaign, 200);
  });

  await step("batch u193 u202 integrations", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session u193", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const plus = await ensureHelpdeskPlan(base, jar, workspaceId);
    jar = plus.jar;

    const categoryRes = await request(base, jar, "POST", "/api/helpdesk/categories", {
      name: `Rename category ${Date.now()}`,
    });
    const category = (
      await expectJson("POST /api/helpdesk/categories rename", categoryRes, 201, (data) =>
        Boolean(data.category?.id),
      )
    ).data.category;

    const renamed = await request(base, jar, "PATCH", `/api/helpdesk/categories/${category.id}`, {
      name: `${category.name} updated`,
    });
    await expectJson("PATCH /api/helpdesk/categories/[id]", renamed, 200, (data) =>
      data.category?.name?.includes("updated"),
    );

    const deletedCategory = await request(
      base,
      jar,
      "DELETE",
      `/api/helpdesk/categories/${category.id}`,
    );
    await expectJson("DELETE /api/helpdesk/categories/[id]", deletedCategory, 200);

    const articleRes = await request(base, jar, "POST", "/api/helpdesk", {
      title: `Status article ${Date.now()}`,
      status: "draft",
    });
    const article = (
      await expectJson("POST /api/helpdesk status toggle", articleRes, 201, (data) =>
        Boolean(data.article?.id),
      )
    ).data.article;

    const statusPatch = await request(base, jar, "PATCH", `/api/helpdesk/${article.id}`, {
      status: "visible",
    });
    await expectJson("PATCH /api/helpdesk/[id] status", statusPatch, 200, (data) =>
      data.article?.status === "visible",
    );

    const contactRes = await request(base, jar, "POST", "/api/contacts", {
      name: "Smoke Edit Contact",
      email: `edit-${Date.now()}@example.com`,
      location: "Paris",
      company: "Smoke Co",
      segments: ["chat"],
    });
    const contact = (
      await expectJson("POST /api/contacts edit target", contactRes, 201, (data) =>
        Boolean(data.contact?.id),
      )
    ).data.contact;

    const contactPatch = await request(base, jar, "PATCH", `/api/contacts/${contact.id}`, {
      name: "Smoke Edited Contact",
    });
    await expectJson("PATCH /api/contacts/[id]", contactPatch, 200, (data) =>
      data.contact?.name === "Smoke Edited Contact",
    );

    const contactDelete = await request(base, jar, "DELETE", `/api/contacts/${contact.id}`);
    await expectJson("DELETE /api/contacts/[id]", contactDelete, 200);

    const campaignRes = await request(base, jar, "POST", "/api/campaigns", {
      name: `Rename campaign ${Date.now()}`,
      type: "one-shot",
    });
    const campaign = (
      await expectJson("POST /api/campaigns rename target", campaignRes, 201, (data) =>
        Boolean(data.campaign?.id),
      )
    ).data.campaign;

    const campaignPatch = await request(base, jar, "PATCH", `/api/campaigns/${campaign.id}`, {
      name: "Renamed Smoke Campaign",
    });
    await expectJson("PATCH /api/campaigns/[id] name", campaignPatch, 200, (data) =>
      data.campaign?.name === "Renamed Smoke Campaign",
    );

    await request(base, jar, "DELETE", `/api/campaigns/${campaign.id}`);

    const pluginsSearch = await request(base, jar, "GET", "/api/plugins?q=analytics");
    await expectJson("GET /api/plugins?q=", pluginsSearch, 200, (data) =>
      Array.isArray(data.plugins),
    );

    const upgraded = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Essentials",
    });
    await expectJson("PATCH /api/billing/plans essentials u193", upgraded, 200);

    const tz = await request(base, jar, "PATCH", "/api/workspaces/analytics", {
      timezone: "Europe/Paris",
    });
    await expectJson("PATCH /api/workspaces/analytics timezone u202", tz, 200, (data) =>
      data.timezone === "Europe/Paris",
    );

    const analytics = await request(base, jar, "GET", "/api/analytics");
    await expectJson("GET /api/analytics conversationChart", analytics, 200, (data) =>
      data.analyticsEnabled === true && Array.isArray(data.conversationChart),
    );

    await request(base, jar, "DELETE", `/api/helpdesk/${article.id}`);
  });

  await step("batch u203 u212 integrations", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session u203", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const templateRes = await request(base, jar, "POST", "/api/campaigns/templates", {
      name: `Smoke template ${Date.now()}`,
      category: "yours",
    });
    const template = (
      await expectJson("POST /api/campaigns/templates u203", templateRes, 201, (data) =>
        Boolean(data.template?.id),
      )
    ).data.template;

    const templatesList = await request(base, jar, "GET", "/api/campaigns/templates");
    await expectJson("GET /api/campaigns/templates u203", templatesList, 200, (data) =>
      Array.isArray(data.templates),
    );

    const templatePatch = await request(
      base,
      jar,
      "PATCH",
      `/api/campaigns/templates/${template.id}`,
      { name: "Renamed Smoke Template" },
    );
    await expectJson("PATCH /api/campaigns/templates/[id] u203", templatePatch, 200, (data) =>
      data.template?.name === "Renamed Smoke Template",
    );

    const visitorsSearch = await request(base, jar, "GET", "/api/visitors?q=paris");
    await expectJson("GET /api/visitors?q= u204", visitorsSearch, 200, (data) =>
      Array.isArray(data.visitors),
    );

    const contactsSegment = await request(base, jar, "GET", "/api/contacts?segment=chat");
    await expectJson("GET /api/contacts?segment= u205", contactsSegment, 200, (data) =>
      Array.isArray(data.contacts),
    );

    const essentials = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Essentials",
    });
    await expectJson("PATCH /api/billing/plans essentials u206", essentials, 200);

    const ratings = await request(base, jar, "GET", "/api/analytics/ratings");
    await expectJson("GET /api/analytics/ratings u206", ratings, 200, (data) =>
      Array.isArray(data.ratings),
    );

    const analytics = await request(base, jar, "GET", "/api/analytics");
    await expectJson("GET /api/analytics visitorChart u207", analytics, 200, (data) =>
      data.analyticsEnabled === true && Array.isArray(data.visitorChart),
    );

    const plus = await ensureHelpdeskPlan(base, jar, workspaceId);
    jar = plus.jar;

    const articleRes = await request(base, jar, "POST", "/api/helpdesk", {
      title: `Detail article ${Date.now()}`,
      body: "Article body for detail modal smoke test.",
      status: "draft",
    });
    const article = (
      await expectJson("POST /api/helpdesk detail u208", articleRes, 201, (data) =>
        Boolean(data.article?.id),
      )
    ).data.article;

    const articleDetail = await request(base, jar, "GET", `/api/helpdesk/${article.id}`);
    await expectJson("GET /api/helpdesk/[id] u208", articleDetail, 200, (data) =>
      Boolean(data.article?.body?.includes("detail modal")),
    );

    const planChange = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Plus",
    });
    await expectJson("PATCH /api/billing/plans change u210", planChange, 200);

    const contactRes = await request(base, jar, "POST", "/api/contacts", {
      name: "Campaign Contact Smoke",
      email: `camp-${Date.now()}@example.com`,
      location: "Paris",
      company: "Smoke Co",
      segments: ["chat"],
    });
    const contact = (
      await expectJson("POST /api/contacts campaign u211", contactRes, 201, (data) =>
        Boolean(data.contact?.id),
      )
    ).data.contact;

    const campaignRes = await request(base, jar, "POST", "/api/campaigns", {
      name: `ContactIds campaign ${Date.now()}`,
      type: "one-shot",
      contactIds: [contact.id],
    });
    const campaign = (
      await expectJson("POST /api/campaigns contactIds u211", campaignRes, 201, (data) =>
        data.campaign?.contactCount >= 1,
      )
    ).data.campaign;

    await request(base, jar, "DELETE", `/api/campaigns/${campaign.id}`);
    await request(base, jar, "DELETE", `/api/contacts/${contact.id}`);
    await request(base, jar, "DELETE", `/api/helpdesk/${article.id}`);
    await request(base, jar, "DELETE", `/api/campaigns/templates/${template.id}`);
  });

  await step("batch u213 u222 integrations", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session u213", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const campaignRes = await request(base, jar, "POST", "/api/campaigns", {
      name: `Detail campaign ${Date.now()}`,
      type: "one-shot",
    });
    const campaign = (
      await expectJson("POST /api/campaigns detail u213", campaignRes, 201, (data) =>
        Boolean(data.campaign?.id),
      )
    ).data.campaign;

    const campaignDetail = await request(base, jar, "GET", `/api/campaigns/${campaign.id}`);
    await expectJson("GET /api/campaigns/[id] u213", campaignDetail, 200, (data) =>
      data.campaign?.id === campaign.id,
    );

    const statusPatch = await request(base, jar, "PATCH", `/api/campaigns/${campaign.id}`, {
      status: "scheduled",
    });
    await expectJson("PATCH /api/campaigns/[id] status u217", statusPatch, 200, (data) =>
      data.campaign?.status === "scheduled",
    );

    const plus = await ensureHelpdeskPlan(base, jar, workspaceId);
    jar = plus.jar;

    const categoryRes = await request(base, jar, "POST", "/api/helpdesk/categories", {
      name: `Detail category ${Date.now()}`,
    });
    const category = (
      await expectJson("POST /api/helpdesk/categories u215", categoryRes, 201, (data) =>
        Boolean(data.category?.id),
      )
    ).data.category;

    const categoryDetail = await request(
      base,
      jar,
      "GET",
      `/api/helpdesk/categories/${category.id}`,
    );
    await expectJson("GET /api/helpdesk/categories/[id] u215", categoryDetail, 200, (data) =>
      data.category?.id === category.id,
    );

    const articleRes = await request(base, jar, "POST", "/api/helpdesk", {
      title: `Edit article ${Date.now()}`,
      body: "Original body",
      status: "draft",
    });
    const article = (
      await expectJson("POST /api/helpdesk edit u214", articleRes, 201, (data) =>
        Boolean(data.article?.id),
      )
    ).data.article;

    const articlePatch = await request(base, jar, "PATCH", `/api/helpdesk/${article.id}`, {
      title: "Edited Smoke Article",
      body: "Updated article body for smoke test.",
      categoryId: category.id,
    });
    await expectJson("PATCH /api/helpdesk/[id] edit u214 u219", articlePatch, 200, (data) =>
      data.article?.title === "Edited Smoke Article" &&
      data.article?.categoryId === category.id,
    );

    const contactRes = await request(base, jar, "POST", "/api/contacts", {
      name: "Location Edit Contact",
      email: `loc-${Date.now()}@example.com`,
      location: "Paris",
      company: "Smoke Co",
      segments: ["chat"],
    });
    const contact = (
      await expectJson("POST /api/contacts location u216", contactRes, 201, (data) =>
        Boolean(data.contact?.id),
      )
    ).data.contact;

    const contactPatch = await request(base, jar, "PATCH", `/api/contacts/${contact.id}`, {
      location: "London",
      company: "Updated Co",
    });
    await expectJson("PATCH /api/contacts/[id] location u216", contactPatch, 200, (data) =>
      data.contact?.location === "London" && data.contact?.company === "Updated Co",
    );

    const essentials = await request(base, jar, "PATCH", "/api/billing/plans", {
      workspaceId,
      planTag: "Essentials",
    });
    await expectJson("PATCH /api/billing/plans essentials u218", essentials, 200);

    const analytics = await request(base, jar, "GET", "/api/analytics");
    await expectJson("GET /api/analytics ratingChart u218", analytics, 200, (data) =>
      Array.isArray(data.ratingChart),
    );

    const config = await request(
      base,
      jar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configChecked = await expectJson("GET /api/chatbox/config u220", config, 200, (data) =>
      Boolean(data.workspaceId),
    );
    const chatboxWorkspaceId = configChecked.data.workspaceId;
    const publicJar = new Map();

    const tempIds = [];
    for (let index = 0; index < 2; index += 1) {
      const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
        workspaceId: chatboxWorkspaceId,
        country: "US",
      });
      const createdChecked = await expectJson(
        `POST /api/chatbox/sessions bulk delete ${index}`,
        created,
        200,
        (data) => Boolean(data.conversationId),
      );
      tempIds.push(createdChecked.data.conversationId);
    }

    const bulkDelete = await request(base, jar, "PATCH", "/api/conversations/bulk-delete", {
      conversationIds: tempIds,
    });
    await expectJson("PATCH /api/conversations/bulk-delete u220", bulkDelete, 200, (data) =>
      Array.isArray(data.deletedIds) && data.deletedIds.length === 2,
    );

    const contactDelete = await request(base, jar, "DELETE", `/api/contacts/${contact.id}`);
    await expectJson("DELETE /api/contacts/[id] u222", contactDelete, 200);

    await request(base, jar, "DELETE", `/api/campaigns/${campaign.id}`);
    await request(base, jar, "DELETE", `/api/helpdesk/${article.id}`);
    await request(base, jar, "DELETE", `/api/helpdesk/categories/${category.id}`);
  });

  await step("batch u223 u232 integrations", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session u223", session, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;

    const config = await request(
      base,
      jar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const chatboxWorkspaceId = (
      await expectJson("GET /api/chatbox/config u223 bulk status", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;
    const publicJar = new Map();

    const tempIds = [];
    for (let index = 0; index < 2; index += 1) {
      const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
        workspaceId: chatboxWorkspaceId,
        country: "US",
      });
      const createdChecked = await expectJson(
        `POST /api/chatbox/sessions bulk status ${index}`,
        created,
        200,
        (data) => Boolean(data.conversationId),
      );
      tempIds.push(createdChecked.data.conversationId);
    }

    const bulkStatus = await request(base, jar, "PATCH", "/api/conversations/bulk-status", {
      conversationIds: tempIds,
      status: "resolved",
    });
    await expectJson("PATCH /api/conversations/bulk-status u223", bulkStatus, 200, (data) =>
      Array.isArray(data.conversations) &&
        data.conversations.every((item) => item.status === "resolved"),
    );

    const contactRes = await request(base, jar, "POST", "/api/contacts", {
      name: "Segment Edit Contact",
      email: `seg-${Date.now()}@example.com`,
      segments: ["chat"],
    });
    const contact = (
      await expectJson("POST /api/contacts segments u224", contactRes, 201, (data) =>
        Boolean(data.contact?.id),
      )
    ).data.contact;

    const contactPatch = await request(base, jar, "PATCH", `/api/contacts/${contact.id}`, {
      segments: ["chat", "shopify"],
    });
    await expectJson("PATCH /api/contacts/[id] segments u224", contactPatch, 200, (data) =>
      data.contact?.segments?.includes("shopify"),
    );

    const pluginId = "overlay";
    const installed = await request(base, jar, "PATCH", `/api/plugins/${pluginId}`, {
      installed: true,
    });
    await expectJson("PATCH /api/plugins/[id] install u225", installed, 200, (data) =>
      data.plugin?.installed === true,
    );

    const uninstalled = await request(base, jar, "PATCH", `/api/plugins/${pluginId}`, {
      installed: false,
    });
    await expectJson("PATCH /api/plugins/[id] uninstall u225", uninstalled, 200, (data) =>
      data.plugin?.installed === false,
    );

    const visitors = await request(base, jar, "GET", "/api/visitors");
    await expectJson("GET /api/visitors u226", visitors, 200, (data) =>
      Array.isArray(data.visitors) && typeof data.stats === "object",
    );

    const templateRes = await request(base, jar, "POST", "/api/campaigns/templates", {
      name: `Category cycle ${Date.now()}`,
      category: "yours",
    });
    const template = (
      await expectJson("POST /api/campaigns/templates u227", templateRes, 201, (data) =>
        Boolean(data.template?.id),
      )
    ).data.template;

    const templatePatch = await request(
      base,
      jar,
      "PATCH",
      `/api/campaigns/templates/${template.id}`,
      { category: "bybelt" },
    );
    await expectJson("PATCH /api/campaigns/templates/[id] category u227", templatePatch, 200, (data) =>
      data.template?.category === "bybelt",
    );

    const invoiceRes = await request(base, jar, "POST", "/api/billing/invoices", {
      invoiceNumber: `INV-U228-${Date.now()}`,
      amountCents: 9900,
      currency: "USD",
      status: "paid",
    });
    const invoice = (
      await expectJson("POST /api/billing/invoices u228", invoiceRes, 201, (data) =>
        Boolean(data.invoice?.id),
      )
    ).data.invoice;

    const invoiceDelete = await request(
      base,
      jar,
      "DELETE",
      `/api/billing/invoices/${invoice.id}`,
    );
    await expectJson("DELETE /api/billing/invoices/[id] u228", invoiceDelete, 200, (data) =>
      data.id === invoice.id,
    );

    const analytics = await request(base, jar, "GET", "/api/analytics");
    await expectJson("GET /api/analytics period u229", analytics, 200, (data) =>
      typeof data.periodStart === "string" && typeof data.periodEnd === "string",
    );

    const plus = await ensureHelpdeskPlan(base, jar, workspaceId);
    jar = plus.jar;

    const articleRes = await request(base, jar, "POST", "/api/helpdesk", {
      title: `Public preview ${Date.now()}`,
      body: "Public preview body",
      status: "visible",
    });
    const article = (
      await expectJson("POST /api/helpdesk public u230", articleRes, 201, (data) =>
        Boolean(data.article?.id),
      )
    ).data.article;

    const publicDetail = await request(
      base,
      publicJar,
      "GET",
      `/api/helpdesk/public/${article.id}?domain=fashionsis.com`,
    );
    await expectJson("GET /api/helpdesk/public/[id] u230", publicDetail, 200, (data) =>
      data.article?.title === article.title,
    );

    const automatedRes = await request(base, jar, "POST", "/api/campaigns", {
      name: `Automated campaign ${Date.now()}`,
      type: "automated",
    });
    const automated = (
      await expectJson("POST /api/campaigns automated u232", automatedRes, 201, (data) =>
        data.campaign?.type === "automated",
      )
    ).data.campaign;

    const tagsList = await request(base, jar, "GET", "/api/campaigns");
    await expectJson("GET /api/campaigns tags u231", tagsList, 200, (data) =>
      Array.isArray(data.campaigns),
    );

    await request(base, jar, "PATCH", "/api/conversations/bulk-delete", {
      conversationIds: tempIds,
    });
    await request(base, jar, "DELETE", `/api/contacts/${contact.id}`);
    await request(base, jar, "DELETE", `/api/campaigns/templates/${template.id}`);
    await request(base, jar, "DELETE", `/api/campaigns/${automated.id}`);
    await request(base, jar, "DELETE", `/api/helpdesk/${article.id}`);
  });

  await step("batch u233 u242 integrations", async () => {
    const spamList = await request(base, jar, "GET", "/api/conversations?segment=spam");
    await expectJson("GET /api/conversations?segment=spam u233", spamList, 200, (data) =>
      Array.isArray(data.conversations),
    );

    const counts = await request(base, jar, "GET", "/api/inbox/counts");
    await expectJson("GET /api/inbox/counts spam u233", counts, 200, (data) =>
      typeof data.spam === "number",
    );

    const subInboxRes = await request(base, jar, "POST", "/api/sub-inboxes", {});
    const subInbox = (
      await expectJson("POST /api/sub-inboxes u234", subInboxRes, 201, (data) =>
        Boolean(data.subInbox?.id),
      )
    ).data.subInbox;

    const subInboxList = await request(
      base,
      jar,
      "GET",
      `/api/conversations?subInboxId=${subInbox.id}`,
    );
    await expectJson("GET /api/conversations?subInboxId= u234", subInboxList, 200, (data) =>
      Array.isArray(data.conversations),
    );

    const config = await request(
      base,
      jar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const chatboxWorkspaceId = (
      await expectJson("GET /api/chatbox/config u235", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;
    const publicJar = new Map();
    const tempSession = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId: chatboxWorkspaceId,
      country: "US",
    });
    const tempConversationId = (
      await expectJson("POST /api/chatbox/sessions delete u235", tempSession, 200, (data) =>
        Boolean(data.conversationId),
      )
    ).data.conversationId;

    const deletedConversation = await request(
      base,
      jar,
      "DELETE",
      `/api/conversations/${tempConversationId}`,
    );
    await expectJson("DELETE /api/conversations/[id] u235", deletedConversation, 200, (data) =>
      data.id === tempConversationId,
    );

    const webhookRes = await request(base, jar, "POST", "/api/workspaces/webhooks", {});
    const webhook = (
      await expectJson("POST /api/workspaces/webhooks u236", webhookRes, 201, (data) =>
        Boolean(data.webhook?.id),
      )
    ).data.webhook;

    const webhookTest = await request(
      base,
      jar,
      "POST",
      `/api/workspaces/webhooks/${webhook.id}/test`,
    );
    await expectJson("POST /api/workspaces/webhooks/[id]/test u236", webhookTest, 200, (data) =>
      data.ok === true,
    );

    const session = await request(base, jar, "GET", "/api/auth/session");
    const operatorId = (
      await expectJson("GET /api/auth/session u237", session, 200, (data) =>
        Boolean(data.user?.id),
      )
    ).data.user.id;

    const rolePatch = await request(base, jar, "PATCH", `/api/workspaces/operators/${operatorId}`, {
      role: "owner",
    });
    await expectJson("PATCH /api/workspaces/operators/[userId] u237", rolePatch, 200, (data) =>
      data.operator?.role?.toLowerCase() === "owner",
    );

    const signatureGet = await request(base, jar, "GET", "/api/settings/email/signature");
    await expectJson("GET /api/settings/email/signature u238", signatureGet, 200, (data) =>
      typeof data.enabled === "boolean" && typeof data.text === "string",
    );

    const signaturePatch = await request(base, jar, "PATCH", "/api/settings/email/signature", {
      enabled: true,
      text: "Smoke signature",
    });
    await expectJson("PATCH /api/settings/email/signature u238", signaturePatch, 200, (data) =>
      data.enabled === true && data.text === "Smoke signature",
    );

    const shortcuts = await request(base, jar, "GET", "/api/message-shortcuts");
    await expectJson("GET /api/message-shortcuts u239", shortcuts, 200, (data) =>
      Array.isArray(data.shortcuts),
    );

    const campaignRes = await request(base, jar, "POST", "/api/campaigns", {
      name: `Detail send ${Date.now()}`,
      type: "one-shot",
    });
    const campaign = (
      await expectJson("POST /api/campaigns u240", campaignRes, 201, (data) =>
        Boolean(data.campaign?.id),
      )
    ).data.campaign;

    const contactRes = await request(base, jar, "POST", "/api/contacts", {
      name: "Campaign Send Contact",
      email: `send-${Date.now()}@example.com`,
      segments: ["chat"],
    });
    const contact = (
      await expectJson("POST /api/contacts u240", contactRes, 201, (data) =>
        Boolean(data.contact?.id),
      )
    ).data.contact;

    await request(base, jar, "POST", `/api/campaigns/${campaign.id}/recipients`, {
      contactIds: [contact.id],
    });

    const campaignSend = await request(base, jar, "POST", `/api/campaigns/${campaign.id}/send`);
    await expectJson("POST /api/campaigns/[id]/send u240", campaignSend, 200, (data) =>
      data.campaign?.status === "sent",
    );

    const sessionForPlus = await request(base, jar, "GET", "/api/auth/session");
    const workspaceId = (
      await expectJson("GET /api/auth/session u241 plus", sessionForPlus, 200, (data) =>
        Boolean(data.workspace?.id),
      )
    ).data.workspace.id;
    const plus = await ensureHelpdeskPlan(base, jar, workspaceId);
    jar = plus.jar;

    const articleRes = await request(base, jar, "POST", "/api/helpdesk", {
      title: `Helpful ${Date.now()}`,
      body: "Helpful body",
      status: "visible",
    });
    const article = (
      await expectJson("POST /api/helpdesk helpful u241", articleRes, 201, (data) =>
        Boolean(data.article?.id),
      )
    ).data.article;

    const helpful = await request(
      base,
      publicJar,
      "POST",
      `/api/helpdesk/public/${article.id}/helpful?domain=fashionsis.com`,
    );
    await expectJson("POST /api/helpdesk/public/[id]/helpful u241", helpful, 200, (data) =>
      typeof data.helpfulCount === "number",
    );

    const blocked = await request(base, jar, "POST", "/api/chatbox/restrictions", {
      kind: "blocked_visitor",
      value: `block-${Date.now()}@example.com`,
    });
    const blockedRestriction = (
      await expectJson("POST /api/chatbox/restrictions blocked_visitor u242", blocked, 201, (data) =>
        data.restriction?.kind === "blocked_visitor",
      )
    ).data.restriction;

    await request(base, jar, "DELETE", `/api/chatbox/restrictions/${blockedRestriction.id}`);
    await request(base, jar, "DELETE", `/api/workspaces/webhooks/${webhook.id}`);
    await request(base, jar, "DELETE", `/api/sub-inboxes/${subInbox.id}`);
    await request(base, jar, "DELETE", `/api/campaigns/${campaign.id}`);
    await request(base, jar, "DELETE", `/api/contacts/${contact.id}`);
    await request(base, jar, "DELETE", `/api/helpdesk/${article.id}`);
  });

  await step("batch u243 u252 integrations", async () => {
    const unassignedList = await request(
      base,
      jar,
      "GET",
      "/api/conversations?status=unassigned",
    );
    await expectJson("GET /api/conversations?status=unassigned u243", unassignedList, 200, (data) =>
      Array.isArray(data.conversations),
    );

    const attachmentsGet = await request(base, jar, "GET", "/api/settings/chatbox/attachments");
    await expectJson("GET /api/settings/chatbox/attachments u244", attachmentsGet, 200, (data) =>
      typeof data.maxBytes === "number",
    );

    const attachmentsPatch = await request(
      base,
      jar,
      "PATCH",
      "/api/settings/chatbox/attachments",
      { maxBytes: 6 * 1024 * 1024 },
    );
    await expectJson("PATCH /api/settings/chatbox/attachments u244", attachmentsPatch, 200, (data) =>
      data.maxBytes === 6 * 1024 * 1024,
    );

    const config = await request(
      base,
      jar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configData = await expectJson("GET /api/chatbox/config ratings u245", config, 200, (data) =>
      typeof data.ratingsEnabled === "boolean",
    );
    const chatboxWorkspaceId = configData.data.workspaceId;
    const publicJar = new Map();
    const sessionRes = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId: chatboxWorkspaceId,
      country: "US",
    });
    const sessionId = (
      await expectJson("POST /api/chatbox/sessions rate u245", sessionRes, 200, (data) =>
        Boolean(data.sessionId),
      )
    ).data.sessionId;

    if (configData.data.ratingsEnabled) {
      const rate = await request(base, publicJar, "POST", `/api/chatbox/sessions/${sessionId}/rate`, {
        score: 5,
      });
      await expectJson("POST /api/chatbox/sessions/[id]/rate u245", rate, 200, (data) =>
        data.score === 5,
      );
    }

    const subInboxRes = await request(base, jar, "POST", "/api/sub-inboxes", {});
    const subInbox = (
      await expectJson("POST /api/sub-inboxes u246", subInboxRes, 201, (data) =>
        Boolean(data.subInbox?.id),
      )
    ).data.subInbox;

    const subInboxPatch = await request(base, jar, "PATCH", `/api/sub-inboxes/${subInbox.id}`, {
      name: `Renamed ${Date.now()}`,
      segment: "vip",
    });
    await expectJson("PATCH /api/sub-inboxes/[id] rename u246", subInboxPatch, 200, (data) =>
      data.subInbox?.segment === "vip",
    );

    const upgrade = await request(base, jar, "PATCH", "/api/billing/plans", {
      planTag: "Essentials",
    });
    await expectJson("PATCH /api/billing/plans sidebar u247", upgrade, 200, (data) =>
      data.plan?.planTag === "Essentials",
    );

    const session = await request(base, jar, "GET", "/api/auth/session");
    const operatorId = (
      await expectJson("GET /api/auth/session u249", session, 200, (data) =>
        Boolean(data.user?.id),
      )
    ).data.user.id;

    const assignedList = await request(
      base,
      jar,
      "GET",
      `/api/conversations?assignedOperatorId=${operatorId}`,
    );
    await expectJson("GET /api/conversations?assignedOperatorId= u249", assignedList, 200, (data) =>
      Array.isArray(data.conversations),
    );

    const pendingList = await request(base, jar, "GET", "/api/conversations?status=pending");
    await expectJson("GET /api/conversations?status=pending u249", pendingList, 200, (data) =>
      Array.isArray(data.conversations),
    );

    const counts = await request(base, jar, "GET", "/api/inbox/counts");
    await expectJson("GET /api/inbox/counts subInboxes u250", counts, 200, (data) =>
      Array.isArray(data.subInboxes),
    );

    const contactRes = await request(base, jar, "POST", "/api/contacts", {
      name: `Modal Contact ${Date.now()}`,
      email: `modal-${Date.now()}@example.com`,
      location: "Paris",
      company: "FashionSis",
      segments: ["chat"],
    });
    const contact = (
      await expectJson("POST /api/contacts modal u252", contactRes, 201, (data) =>
        Boolean(data.contact?.id),
      )
    ).data.contact;

    await request(base, jar, "DELETE", `/api/sub-inboxes/${subInbox.id}`);
    await request(base, jar, "DELETE", `/api/contacts/${contact.id}`);
  });

  await step("batch u253 u262 integrations", async () => {
    const createConv = await request(base, jar, "POST", "/api/conversations", {});
    const createdConversation = (
      await expectJson("POST /api/conversations u253", createConv, 201, (data) =>
        Boolean(data.conversation?.id),
      )
    ).data.conversation;

    const analytics14 = await request(base, jar, "GET", "/api/analytics?days=14");
    await expectJson("GET /api/analytics?days=14 u256", analytics14, 200, (data) =>
      typeof data.kpis === "object",
    );

    const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = new Date().toISOString();
    const transparency = await request(
      base,
      jar,
      "GET",
      `/api/workspaces/transparency?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`,
    );
    await expectJson("GET /api/workspaces/transparency date range u258", transparency, 200, (data) =>
      Array.isArray(data.logs),
    );

    const bulkContactA = await request(base, jar, "POST", "/api/contacts", {
      name: `Bulk A ${Date.now()}`,
      email: `bulk-a-${Date.now()}@example.com`,
      location: "Paris",
      company: "FashionSis",
      segments: ["chat"],
    });
    const bulkContactB = await request(base, jar, "POST", "/api/contacts", {
      name: `Bulk B ${Date.now()}`,
      email: `bulk-b-${Date.now()}@example.com`,
      location: "Paris",
      company: "FashionSis",
      segments: ["chat"],
    });
    const contactA = (
      await expectJson("POST /api/contacts bulk u259", bulkContactA, 201, (data) =>
        Boolean(data.contact?.id),
      )
    ).data.contact;
    const contactB = (
      await expectJson("POST /api/contacts bulk u259 b", bulkContactB, 201, (data) =>
        Boolean(data.contact?.id),
      )
    ).data.contact;

    const bulkDeleteContacts = await request(base, jar, "POST", "/api/contacts/bulk-delete", {
      contactIds: [contactA.id, contactB.id],
    });
    await expectJson("POST /api/contacts/bulk-delete u259", bulkDeleteContacts, 200, (data) =>
      Array.isArray(data.deletedIds) && data.deletedIds.length === 2,
    );

    const campaignTags = await request(base, jar, "GET", "/api/campaigns/tags?q=promo");
    await expectJson("GET /api/campaigns/tags u260", campaignTags, 200, (data) =>
      Array.isArray(data.tags) && data.tags.includes("promo"),
    );

    const visitors = await request(base, jar, "GET", "/api/visitors");
    await expectJson("GET /api/visitors conversationId u255", visitors, 200, (data) =>
      Array.isArray(data.visitors) &&
      data.visitors.every((visitor) => "conversationId" in visitor),
    );

    await request(base, jar, "DELETE", `/api/conversations/${createdConversation.id}`);
  });

  await step("batch u263 u272 integrations", async () => {
    const overlayInstall = await request(base, jar, "PATCH", "/api/plugins/overlay", {
      installed: true,
    });
    await expectJson("PATCH /api/plugins/overlay u263", overlayInstall, 200, (data) =>
      Boolean(data.plugin?.installed),
    );

    const watchdogInstall = await request(base, jar, "PATCH", "/api/plugins/watchdog", {
      installed: true,
    });
    await expectJson("PATCH /api/plugins/watchdog u263", watchdogInstall, 200, (data) =>
      Boolean(data.plugin?.installed),
    );

    const embed = await request(base, jar, "GET", "/api/chatbox/embed");
    await expectJson("GET /api/chatbox/embed u264", embed, 200, (data) =>
      typeof data.htmlSnippet === "string" && data.htmlSnippet.length > 0,
    );

    const sortedUnread = await request(base, jar, "GET", "/api/conversations?sort=unread");
    await expectJson("GET /api/conversations?sort=unread u265", sortedUnread, 200, (data) =>
      Array.isArray(data.conversations),
    );

    const config = await request(
      base,
      jar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const configData = await expectJson("GET /api/chatbox/config u266", config, 200, (data) =>
      Boolean(data.workspaceId),
    );
    const publicJar = new Map();
    const sessionRes = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId: configData.data.workspaceId,
      country: "US",
    });
    const sessionId = (
      await expectJson("POST /api/chatbox/sessions u266", sessionRes, 200, (data) =>
        Boolean(data.sessionId),
      )
    ).data.sessionId;

    const identityPatch = await request(
      base,
      publicJar,
      "PATCH",
      `/api/chatbox/sessions/${sessionId}`,
      { email: `widget-${Date.now()}@example.com` },
    );
    await expectJson("PATCH /api/chatbox/sessions/[id] u266", identityPatch, 200, (data) =>
      typeof data.email === "string",
    );

    const publicHelpdesk = await request(
      base,
      jar,
      "GET",
      "/api/helpdesk/public?domain=fashionsis.com",
    );
    await expectJson("GET /api/helpdesk/public u267", publicHelpdesk, 200, (data) =>
      Array.isArray(data.articles),
    );

    const bulkContact = await request(base, jar, "POST", "/api/contacts", {
      name: `Segment Contact ${Date.now()}`,
      email: `segment-${Date.now()}@example.com`,
      location: "Paris",
      company: "FashionSis",
      segments: ["chat"],
    });
    const contact = (
      await expectJson("POST /api/contacts bulk-segment u270", bulkContact, 201, (data) =>
        Boolean(data.contact?.id),
      )
    ).data.contact;

    const bulkSegment = await request(base, jar, "POST", "/api/contacts/bulk-segment", {
      contactIds: [contact.id],
      segment: "shopify",
    });
    await expectJson("POST /api/contacts/bulk-segment u270", bulkSegment, 200, (data) =>
      data.segment === "shopify" && Array.isArray(data.updatedIds),
    );

    await request(base, jar, "DELETE", `/api/contacts/${contact.id}`);
  });

  await step("batch u273 u282 integrations", async () => {
    const emailIpInstall = await request(base, jar, "PATCH", "/api/plugins/dedicated-email-ip", {
      installed: true,
    });
    await expectJson("PATCH /api/plugins/dedicated-email-ip u279", emailIpInstall, 200, (data) =>
      Boolean(data.plugin?.installed),
    );

    const promoCampaign = await request(base, jar, "POST", "/api/campaigns", {
      name: `Promo Campaign ${Date.now()}`,
      type: "one-shot",
      status: "draft",
    });
    const campaign = (
      await expectJson("POST /api/campaigns promo u281", promoCampaign, 201, (data) =>
        Boolean(data.campaign?.id),
      )
    ).data.campaign;

    const tagged = await request(base, jar, "GET", "/api/campaigns?tag=promo");
    await expectJson("GET /api/campaigns?tag=promo u281", tagged, 200, (data) =>
      Array.isArray(data.campaigns) &&
      data.campaigns.some((item) => item.id === campaign.id),
    );

    const ratings = await request(base, jar, "GET", "/api/analytics/ratings");
    await expectJson("GET /api/analytics/ratings u282", ratings, 200, (data) =>
      Array.isArray(data.ratings),
    );

    const createdConversation = await request(base, jar, "POST", "/api/conversations", {});
    const conversation = (
      await expectJson("POST /api/conversations u274", createdConversation, 201, (data) =>
        Boolean(data.conversation?.id),
      )
    ).data.conversation;

    const markUnread = await request(base, jar, "PATCH", `/api/conversations/${conversation.id}`, {
      unread: 1,
    });
    await expectJson("PATCH /api/conversations/[id] unread u274", markUnread, 200, (data) =>
      data.conversation?.unread === 1,
    );

    const shortcuts = await request(base, jar, "GET", "/api/message-shortcuts");
    await expectJson("GET /api/message-shortcuts u276", shortcuts, 200, (data) =>
      Array.isArray(data.shortcuts),
    );

    await request(base, jar, "DELETE", `/api/conversations/${conversation.id}`);
    await request(base, jar, "DELETE", `/api/campaigns/${campaign.id}`);
  });

  await step("batch u283 u292 integrations", async () => {
    const customDomain = await request(base, jar, "PATCH", "/api/settings/email/domain", {
      key: "customDomain",
      value: `mail-${Date.now()}.example.com`,
    });
    await expectJson("PATCH /api/settings/email/domain custom u289", customDomain, 200, (data) =>
      Boolean(data.key === "customDomain"),
    );

    const verifyDomain = await request(base, jar, "PATCH", "/api/settings/email/domain", {
      key: "domainVerified",
      value: "true",
    });
    await expectJson("PATCH /api/settings/email/domain verify u289", verifyDomain, 200, (data) =>
      data.value === "true",
    );

    const invoice = await request(base, jar, "POST", "/api/billing/invoices", {
      invoiceNumber: `INV-U290-${Date.now()}`,
      amountCents: 1900,
      currency: "USD",
      status: "paid",
    });
    const createdInvoice = (
      await expectJson("POST /api/billing/invoices u290", invoice, 201, (data) =>
        Boolean(data.invoice?.id),
      )
    ).data.invoice;
    await request(base, jar, "DELETE", `/api/billing/invoices/${createdInvoice.id}`);

    const helpdesk = await request(base, jar, "GET", "/api/helpdesk");
    await expectJson("GET /api/helpdesk u287", helpdesk, 200, (data) =>
      Array.isArray(data.articles),
    );

    const operators = await request(base, jar, "GET", "/api/workspaces/operators");
    await expectJson("GET /api/workspaces/operators u284", operators, 200, (data) =>
      Array.isArray(data.operators),
    );

    const analytics = await request(base, jar, "GET", "/api/analytics?days=14");
    await expectJson("GET /api/analytics?days=14 u283", analytics, 200, (data) =>
      typeof data.kpis === "object",
    );
  });

  await step("batch u293 u302 integrations", async () => {
    const shortcuts = await request(base, jar, "GET", "/api/message-shortcuts");
    await expectJson("GET /api/message-shortcuts u297", shortcuts, 200, (data) =>
      Array.isArray(data.shortcuts),
    );

    const helpdesk = await request(base, jar, "GET", "/api/helpdesk");
    await expectJson("GET /api/helpdesk u299", helpdesk, 200, (data) =>
      Array.isArray(data.articles),
    );

    const contacts = await request(base, jar, "GET", "/api/contacts");
    await expectJson("GET /api/contacts u300", contacts, 200, (data) =>
      Array.isArray(data.contacts),
    );

    const campaigns = await request(base, jar, "GET", "/api/campaigns");
    await expectJson("GET /api/campaigns u302", campaigns, 200, (data) =>
      Array.isArray(data.campaigns),
    );

    const operatorMessage = (
      await expectJson(
        "GET /api/conversations/[id] for message edit u301",
        await request(base, jar, "GET", `/api/conversations/${conversationId}`),
        200,
        (data) => Boolean(data.messages?.some((message) => message.from === "operator")),
      )
    ).data.messages.find((message) => message.from === "operator");

    const editedText = `Edited operator smoke ${Date.now()}`;
    const edited = await request(
      base,
      jar,
      "PATCH",
      `/api/conversations/${conversationId}/messages/${operatorMessage.id}`,
      { text: editedText },
    );
    await expectJson("PATCH /api/conversations/[id]/messages/[messageId] u301", edited, 200, (data) =>
      Boolean(data.message?.from === "operator" && data.message.text === editedText),
    );
  });

  await step("batch u303 u312 integrations", async () => {
    const frequentSearches = await request(base, jar, "GET", "/api/search-ai/frequent-searches");
    await expectJson("GET /api/search-ai/frequent-searches u303", frequentSearches, 200, (data) =>
      Array.isArray(data.searches),
    );

    const helpdesk = await request(base, jar, "GET", "/api/helpdesk");
    await expectJson("GET /api/helpdesk u304", helpdesk, 200, (data) =>
      Array.isArray(data.articles),
    );

    const campaigns = await request(base, jar, "GET", "/api/campaigns");
    await expectJson("GET /api/campaigns u305", campaigns, 200, (data) =>
      Array.isArray(data.campaigns),
    );

    const training = await request(base, jar, "POST", "/api/workspaces/data/training");
    await expectJson("POST /api/workspaces/data/training u308", training, 200, (data) =>
      Boolean(data.training?.magicReplyNeverTrained === false),
    );
  });

  await step("batch u313 u322 integrations", async () => {
    const exportCsv = await request(base, jar, "GET", "/api/contacts/export");
    if (exportCsv.response.status !== 200) {
      throw new Error(`GET /api/contacts/export u319 expected 200, got ${exportCsv.response.status}`);
    }
    const contentType = exportCsv.response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/csv")) {
      throw new Error(`GET /api/contacts/export u319 expected text/csv, got ${contentType}`);
    }
    const csvText = await exportCsv.response.text();
    if (!csvText.startsWith("Name,Email,")) {
      throw new Error("GET /api/contacts/export u319 expected CSV header row");
    }

    const publicJar = new Map();
    const config = await request(
      base,
      publicJar,
      "GET",
      "/api/chatbox/config?domain=fashionsis.com",
    );
    const workspaceId = (
      await expectJson("GET /api/chatbox/config for u318", config, 200, (data) =>
        Boolean(data.workspaceId),
      )
    ).data.workspaceId;

    const created = await request(base, publicJar, "POST", "/api/chatbox/sessions", {
      workspaceId,
      pageUrl: "/collections/summer-sale",
    });
    const sessionId = (
      await expectJson("POST /api/chatbox/sessions for u318", created, 200, (data) =>
        Boolean(data.sessionId),
      )
    ).data.sessionId;

    await request(base, publicJar, "POST", `/api/chatbox/sessions/${sessionId}/ping`, {
      pageUrl: "/collections/summer-sale",
    });

    const visitors = await request(base, jar, "GET", "/api/visitors");
    const visitorsChecked = await expectJson("GET /api/visitors u318", visitors, 200, (data) =>
      Array.isArray(data.visitors) && data.visitors.length > 0,
    );
    const visitor = visitorsChecked.data.visitors[0];
    const startConversation = await request(base, jar, "POST", "/api/conversations", {
      name: visitor.name,
    });
    await expectJson("POST /api/conversations u318", startConversation, 201, (data) =>
      Boolean(data.conversation?.id && data.conversation.name === visitor.name),
    );
  });

  await step("batch u323 u332 integrations", async () => {
    const publicHelp = await request(
      base,
      jar,
      "GET",
      "/api/helpdesk/public?domain=fashionsis.com",
    );
    const publicChecked = await expectJson("GET /api/helpdesk/public u327", publicHelp, 200, (data) =>
      Array.isArray(data.articles),
    );

    if (publicChecked.data.articles.length > 0) {
      const articleId = publicChecked.data.articles[0].id;
      const detail = await request(
        base,
        jar,
        "GET",
        `/api/helpdesk/public/${articleId}?domain=fashionsis.com`,
      );
      await expectJson("GET /api/helpdesk/public/[id] u328", detail, 200, (data) =>
        Boolean(data.article?.id === articleId),
      );
    }

    const forgot = await request(base, jar, "POST", "/api/auth/forgot-password", {
      email: "contact@fashionpara.com",
    });
    await expectJson("POST /api/auth/forgot-password u330", forgot, 200, (data) =>
      Boolean(data.ok === true && typeof data.message === "string"),
    );

    const verifyRequest = await request(base, jar, "POST", "/api/auth/verify-email/request");
    await expectJson("POST /api/auth/verify-email/request u330", verifyRequest, 200, (data) =>
      Boolean(data.ok === true),
    );
  });

  await step("batch u333 u342 integrations", async () => {
    const publicHelp = await request(
      base,
      jar,
      "GET",
      "/api/helpdesk/public?domain=fashionsis.com",
    );
    const publicChecked = await expectJson("GET /api/helpdesk/public u327 u341", publicHelp, 200, (data) =>
      Array.isArray(data.articles),
    );

    if (publicChecked.data.articles.length > 0) {
      const articleId = publicChecked.data.articles[0].id;
      const helpful = await request(
        base,
        jar,
        "POST",
        `/api/helpdesk/public/${articleId}/helpful?domain=fashionsis.com`,
      );
      await expectJson("POST /api/helpdesk/public/[id]/helpful u334", helpful, 200, (data) =>
        typeof data.helpfulCount === "number" && data.helpfulCount >= 1,
      );
    }

    const sitemap = await fetch(`${base}/sitemap.xml`);
    if (!sitemap.ok) {
      throw new Error(`GET /sitemap.xml u335 expected 200, got ${sitemap.status}`);
    }
    const sitemapXml = await sitemap.text();
    for (const origin of ["help.bybelt.com", "docs.bybelt.com", "status.bybelt.com"]) {
      if (!sitemapXml.includes(origin)) {
        throw new Error(`GET /sitemap.xml u335 missing origin ${origin}`);
      }
    }
  });

  await step("batch u343 u352 integrations", async () => {
    const publicHelp = await request(
      base,
      jar,
      "GET",
      "/api/helpdesk/public?domain=fashionsis.com",
    );
    const publicChecked = await expectJson("GET /api/helpdesk/public u343", publicHelp, 200, (data) =>
      Array.isArray(data.articles),
    );

    if (publicChecked.data.articles.length > 0) {
      const articleId = publicChecked.data.articles[0].id;
      const page = await fetch(`${base}/help-center/article/${articleId}`);
      if (!page.ok) {
        throw new Error(`GET /help-center/article/[id] u343 expected 200, got ${page.status}`);
      }
      const html = await page.text();
      if (!html.includes("Was this article helpful")) {
        throw new Error("GET /help-center/article/[id] u334 missing feedback UI");
      }
    }

    const robots = await fetch(`${base}/robots.txt`);
    if (!robots.ok) {
      throw new Error(`GET /robots.txt u351 expected 200, got ${robots.status}`);
    }
    const robotsTxt = await robots.text();
    if (!robotsTxt.includes("www.bybelt.com/sitemap.xml")) {
      throw new Error("GET /robots.txt u351 missing marketing sitemap origin");
    }

    const devDocs = await fetch(`${base}/developer-docs`);
    if (!devDocs.ok) {
      throw new Error(`GET /developer-docs u337 expected 200, got ${devDocs.status}`);
    }
    const devHtml = await devDocs.text();
    for (const anchor of ["analytics", "visitors", "integrations"]) {
      if (!devHtml.includes(`id="${anchor}"`)) {
        throw new Error(`GET /developer-docs u337 missing section #${anchor}`);
      }
    }
  });

  await step("batch u353 u362 integrations", async () => {
    const embed = await request(base, jar, "GET", "/api/chatbox/embed");
    const embedChecked = await expectJson("GET /api/chatbox/embed u361", embed, 200, (data) =>
      typeof data.scriptUrl === "string" && data.scriptUrl.includes("/embed.js"),
    );
    if (!embedChecked.data.htmlSnippet.includes("BYBELT_CHAT")) {
      throw new Error("GET /api/chatbox/embed u361 missing BYBELT_CHAT snippet");
    }

    const devDocs = await fetch(`${base}/developer-docs`);
    const devHtml = await devDocs.text();
    for (const anchor of ["ai-agent", "inbox"]) {
      if (!devHtml.includes(`id="${anchor}"`)) {
        throw new Error(`GET /developer-docs u357 missing section #${anchor}`);
      }
    }

    const helpCenter = await fetch(`${base}/help-center`);
    if (!helpCenter.ok) {
      throw new Error(`GET /help-center u357 expected 200, got ${helpCenter.status}`);
    }
    const helpHtml = await helpCenter.text();
    if (!helpHtml.includes("og:image") && !helpHtml.includes("Help Center")) {
      throw new Error("GET /help-center u357 missing SEO or title content");
    }
  });

  await step("batch u363 u372 integrations", async () => {
    const devDocs = await fetch(`${base}/developer-docs`);
    if (!devDocs.ok) {
      throw new Error(`GET /developer-docs u370 expected 200, got ${devDocs.status}`);
    }
    const devHtml = await devDocs.text();
    if (!devHtml.includes('id="chat-widget"')) {
      throw new Error("GET /developer-docs u370 missing section #chat-widget");
    }

    const sitemap = await fetch(`${base}/sitemap.xml`);
    if (!sitemap.ok) {
      throw new Error(`GET /sitemap.xml u368 expected 200, got ${sitemap.status}`);
    }
    const sitemapXml = await sitemap.text();
    if (!sitemapXml.includes("help.bybelt.com")) {
      throw new Error("GET /sitemap.xml u368 missing help.bybelt.com origin");
    }

    const embed = await request(base, jar, "GET", "/api/chatbox/embed");
    await expectJson("GET /api/chatbox/embed u361 regression", embed, 200, (data) =>
      typeof data.scriptUrl === "string" && data.scriptUrl.includes("/embed.js"),
    );
  });

  await step("batch u373 u382 integrations", async () => {
    const devDocs = await fetch(`${base}/developer-docs`);
    const devHtml = await devDocs.text();
    if (!devHtml.includes("help.bybelt.com")) {
      throw new Error("GET /developer-docs u380 missing help center link in helpdesk section");
    }

    const statusPage = await fetch(`${base}/system-status`);
    const statusHtml = await statusPage.text();
    if (!statusHtml.includes("chat.bybelt.com")) {
      throw new Error("GET /system-status u376 missing APP_HOST label");
    }

    const robots = await fetch(`${base}/robots.txt`);
    const robotsTxt = await robots.text();
    if (!robotsTxt.includes("sitemap.xml")) {
      throw new Error("GET /robots.txt u381 missing sitemap reference");
    }
  });

  await step("batch u383 u392 integrations", async () => {
    const sitemap = await fetch(`${base}/sitemap.xml`);
    const sitemapXml = await sitemap.text();
    for (const authPath of ["/initiate/reset", "/initiate/verify-email"]) {
      if (!sitemapXml.includes(authPath)) {
        throw new Error(`GET /sitemap.xml u389 missing ${authPath}`);
      }
    }

    const devDocs = await fetch(`${base}/developer-docs`);
    const devHtml = await devDocs.text();
    if (!devHtml.includes('id="rest-api"') || !devHtml.includes("chat.bybelt.com/settings")) {
      throw new Error("GET /developer-docs u386 missing REST API section or settings links");
    }

    const statusPage = await fetch(`${base}/system-status`);
    const statusHtml = await statusPage.text();
    if (!statusHtml.includes("www.bybelt.com")) {
      throw new Error("GET /system-status u390 missing marketing home link");
    }
  });

  await step("batch u393 u402 integrations", async () => {
    const embed = await request(base, jar, "GET", "/api/chatbox/embed");
    await expectJson("GET /api/chatbox/embed u393 widget regression", embed, 200, (data) =>
      typeof data.scriptUrl === "string" && data.scriptUrl.includes("/embed.js"),
    );

    const search = await request(base, jar, "GET", "/api/search?q=account");
    await expectJson("GET /api/search u399 settings paths", search, 200, (data) =>
      Array.isArray(data.settings) &&
      (data.settings.length === 0 ||
        data.settings.every((item) => typeof item.href === "string" && item.href.startsWith("/settings/"))),
    );

    const statusPage = await fetch(`${base}/system-status`);
    const statusHtml = await statusPage.text();
    if (!statusHtml.includes("www.bybelt.com")) {
      throw new Error("GET /system-status u401 missing marketing home link");
    }
  });

  await step("batch u403 u412 integrations", async () => {
    const embed = await request(base, jar, "GET", "/api/chatbox/embed");
    await expectJson("GET /api/chatbox/embed u409 paths", embed, 200, (data) =>
      typeof data.scriptUrl === "string" &&
      data.scriptUrl.includes("/embed.js") &&
      typeof data.widgetUrl === "string" &&
      data.widgetUrl.includes("/widget"),
    );

    const sitemap = await fetch(`${base}/sitemap.xml`);
    const sitemapXml = await sitemap.text();
    for (const appPath of ["/embed.js", "/widget"]) {
      if (!sitemapXml.includes(appPath)) {
        throw new Error(`GET /sitemap.xml u411 missing ${appPath}`);
      }
    }

    const devDocs = await fetch(`${base}/developer-docs`);
    const devHtml = await devDocs.text();
    if (!devHtml.includes("/api") || !devHtml.includes("embed.js")) {
      throw new Error("GET /developer-docs u404 missing API or embed script references");
    }
  });

  await step("batch u413 u422 integrations", async () => {
    const navSearch = await request(base, jar, "GET", "/api/search?q=knowledge");
    await expectJson("GET /api/search u419 helpdesk nav paths", navSearch, 200, (data) =>
      Array.isArray(data.navigation) &&
      data.navigation.some((item) => item.href === "/helpdesk/articles"),
    );

    const visitorSearch = await request(base, jar, "GET", "/api/search?q=visitor");
    await expectJson("GET /api/search u419 visitor href", visitorSearch, 200, (data) =>
      !data.visitors?.length ||
      data.visitors.every((item) => item.href === "/visitors"),
    );

    const helpCenter = await fetch(`${base}/help-center`);
    const helpHtml = await helpCenter.text();
    if (!helpHtml.includes("docs.bybelt.com") || !helpHtml.includes("status.bybelt.com")) {
      throw new Error("GET /help-center u417 missing PUBLIC docs/status links");
    }

    const marketing = await fetch(`${base}/`);
    const marketingHtml = await marketing.text();
    if (!marketingHtml.includes("status.bybelt.com")) {
      throw new Error("GET / u418 missing PUBLIC_STATUS_URL in footer");
    }

    const embed = await request(base, jar, "GET", "/api/chatbox/embed");
    await expectJson("GET /api/chatbox/embed u422 embed regression", embed, 200, (data) =>
      typeof data.scriptUrl === "string" && data.scriptUrl.includes("/embed.js"),
    );
  });

  await step("batch u423 u432 integrations", async () => {
    const devDocs = await fetch(`${base}/developer-docs`);
    const devHtml = await devDocs.text();
    if (!devHtml.includes("help.bybelt.com") || !devHtml.includes("status.bybelt.com")) {
      throw new Error("GET /developer-docs u423 missing PUBLIC help/status links");
    }

    const statusPage = await fetch(`${base}/system-status`);
    const statusHtml = await statusPage.text();
    if (!statusHtml.includes("help.bybelt.com") || !statusHtml.includes("docs.bybelt.com")) {
      throw new Error("GET /system-status u424 missing PUBLIC help/docs links");
    }

    const loginPage = await fetch(`${base}/initiate/login`);
    const loginHtml = await loginPage.text();
    if (!loginHtml.includes("help.bybelt.com")) {
      throw new Error("GET /initiate/login u425 missing PUBLIC_HELP_CENTER_URL");
    }

    const analyticsSearch = await request(base, jar, "GET", "/api/search?q=overview");
    await expectJson("GET /api/search u431 analytics nav regression", analyticsSearch, 200, (data) =>
      Array.isArray(data.navigation) &&
      data.navigation.some((item) => item.href === "/analytics/messaging/overview"),
    );

    const integrations = await fetch(`${base}/integrations`);
    const integrationsHtml = await integrations.text();
    if (!integrationsHtml.includes("chat.bybelt.com/plugins")) {
      throw new Error("GET /integrations u430 missing appPluginsUrl CTA");
    }
  });

  await step("batch u433 u442 integrations", async () => {
    const pricing = await fetch(`${base}/pricing`);
    const pricingHtml = await pricing.text();
    if (!pricingHtml.includes("www.bybelt.com/contact")) {
      throw new Error("GET /pricing u433 missing PUBLIC_CONTACT_URL");
    }

    const hugo = await fetch(`${base}/hugo`);
    const hugoHtml = await hugo.text();
    if (!hugoHtml.includes('href="/ai-agent"') && !hugoHtml.includes('href="/en/ai-agent"')) {
      throw new Error("GET /hugo u435 missing marketingFeaturePath ai-agent link");
    }

    const sitemap = await fetch(`${base}/sitemap.xml`);
    const sitemapXml = await sitemap.text();
    for (const appPath of ["/agent", "/analytics", "/plugins"]) {
      if (!sitemapXml.includes(appPath)) {
        throw new Error(`GET /sitemap.xml u440 missing ${appPath}`);
      }
    }

    const navSearch = await request(base, jar, "GET", "/api/search?q=plugins");
    await expectJson("GET /api/search u439 plugins nav", navSearch, 200, (data) =>
      Array.isArray(data.navigation) &&
      data.navigation.some((item) => item.href === "/plugins"),
    );
  });

  await step("batch u443 u452 integrations", async () => {
    const chatbot = await fetch(`${base}/chatbot`);
    const chatbotHtml = await chatbot.text();
    if (!chatbotHtml.includes('href="/ai-agent"') && !chatbotHtml.includes('href="/en/ai-agent"')) {
      throw new Error("GET /chatbot u443 missing marketingFeaturePath ai-agent");
    }

    const aiAgent = await fetch(`${base}/ai-agent`);
    const aiAgentHtml = await aiAgent.text();
    if (!aiAgentHtml.includes('href="/pricing"') && !aiAgentHtml.includes('href="/en/pricing"')) {
      throw new Error("GET /ai-agent u443 missing marketingFeaturePath pricing");
    }

    const agentWelcome = await fetch(`${base}/agent`);
    if (agentWelcome.status !== 200) {
      throw new Error(`GET /agent u445 expected 200, got ${agentWelcome.status}`);
    }

    const robots = await fetch(`${base}/robots.txt`);
    const robotsTxt = await robots.text();
    if (!robotsTxt.includes("Disallow: /settings/") || !robotsTxt.includes("Disallow: /analytics/")) {
      throw new Error("GET /robots.txt u450 missing APP_* disallow paths");
    }

    const pluginsPage = await fetch(`${base}/plugins`);
    if (pluginsPage.status !== 200 && pluginsPage.status !== 307) {
      throw new Error(`GET /plugins u451 expected 200 or redirect, got ${pluginsPage.status}`);
    }
  });

  await step("batch u453 u462 integrations", async () => {
    const helpCenter = await fetch(`${base}/help-center`);
    const helpHtml = await helpCenter.text();
    if (!helpHtml.includes("/help-center/article") && !helpHtml.includes("help.bybelt.com/article")) {
      throw new Error("GET /help-center u458 missing helpCenterArticlePath links");
    }

    const embed = await request(base, jar, "GET", "/api/chatbox/embed");
    await expectJson("GET /api/chatbox/embed u460 widget path", embed, 200, (data) =>
      typeof data.widgetUrl === "string" && data.widgetUrl.includes("/widget"),
    );

    const footer = await fetch(`${base}/`);
    const footerHtml = await footer.text();
    if (!footerHtml.includes("www.bybelt.com/blog")) {
      throw new Error("GET / u456 missing marketingExternalUrl blog link");
    }

    const devDocs = await fetch(`${base}/developer-docs`);
    if (devDocs.status !== 200) {
      throw new Error(`GET /developer-docs u454 expected 200, got ${devDocs.status}`);
    }
  });

  await step("batch u463 u472 integrations", async () => {
    const sitemap = await fetch(`${base}/sitemap.xml`);
    if (!sitemap.ok) {
      throw new Error(`GET /sitemap.xml u467 expected 200, got ${sitemap.status}`);
    }
    const sitemapXml = await sitemap.text();
    for (const entry of [
      "help.bybelt.com/help-center",
      "docs.bybelt.com/developer-docs",
      "status.bybelt.com/system-status",
    ]) {
      if (!sitemapXml.includes(entry)) {
        throw new Error(`GET /sitemap.xml u467 missing ${entry}`);
      }
    }

    const login = await fetch(`${base}/initiate/login`);
    const loginHtml = await login.text();
    if (!loginHtml.includes("/api/auth/google")) {
      throw new Error("GET /initiate/login u468 missing APP_AUTH_GOOGLE_PATH");
    }

    const publicHelpdesk = await fetch(
      `${base}/api/helpdesk/public?domain=${encodeURIComponent("fashionsis.com")}`,
    );
    if (publicHelpdesk.status !== 200) {
      throw new Error(
        `GET /api/helpdesk/public u469 expected 200, got ${publicHelpdesk.status}`,
      );
    }

    const helpCenter = await fetch(`${base}/help-center`);
    if (helpCenter.status !== 200) {
      throw new Error(`GET /help-center u470 expected 200, got ${helpCenter.status}`);
    }

    const pricing = await fetch(`${base}/pricing`);
    const pricingHtml = await pricing.text();
    if (!pricingHtml.includes("www.bybelt.com/contact") && !pricingHtml.includes("/contact")) {
      throw new Error("GET /pricing u464 missing marketing contact link");
    }
  });

  await step("conversation note", async () => {
    const noteText = `Internal note smoke ${Date.now()}`;
    const created = await request(base, jar, "POST", `/api/conversations/${conversationId}/notes`, {
      text: noteText,
    });
    await expectJson("POST /api/conversations/[id]/notes", created, 200, (data) =>
      Boolean(data.message?.from === "note" && data.message.text === noteText),
    );

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] after note", detail, 200, (data) =>
      Boolean(
        data.messages?.some(
          (message) => message.from === "note" && message.text === noteText,
        ),
      ),
    );

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations note preview", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === conversationId);
      return Boolean(conversation?.preview?.toLowerCase().startsWith("note:"));
    });

    const empty = await request(base, jar, "POST", `/api/conversations/${conversationId}/notes`, {
      text: "   ",
    });
    if (empty.response.status !== 400) {
      throw new Error(
        `POST /api/conversations/[id]/notes empty text expected 400, got ${empty.response.status}`,
      );
    }
  });

  await step("conversation reminder", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson(
      "GET /api/auth/session for reminder",
      session,
      200,
      (data) => Boolean(data.user?.id),
    );
    const operatorId = sessionChecked.data.user.id;
    const remindAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const noteText = `Reminder smoke ${Date.now()}`;

    const past = await request(base, jar, "POST", `/api/conversations/${conversationId}/reminders`, {
      note: noteText,
      remindAt: new Date(Date.now() - 60_000).toISOString(),
    });
    await expectStatus("POST /api/conversations/[id]/reminders past remindAt", past, 400);

    const created = await request(base, jar, "POST", `/api/conversations/${conversationId}/reminders`, {
      note: noteText,
      remindAt,
    });
    const createdChecked = await expectJson(
      "POST /api/conversations/[id]/reminders",
      created,
      200,
      (data) =>
        Boolean(
          data.message?.from === "reminder" &&
            data.message?.text === noteText &&
            data.message?.remindAt &&
            data.message?.author?.id === operatorId &&
            data.reminder?.id,
        ),
    );
    const reminderId = createdChecked.data.reminder.id;

    const listed = await request(base, jar, "GET", `/api/conversations/${conversationId}/reminders`);
    await expectJson("GET /api/conversations/[id]/reminders", listed, 200, (data) =>
      Boolean(data.reminders?.some((item) => item.id === reminderId && item.note === noteText)),
    );

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] after reminder", detail, 200, (data) =>
      Boolean(
        data.messages?.some(
          (message) =>
            message.from === "reminder" &&
            message.text === noteText &&
            message.reminderId === reminderId,
        ) && data.conversation?.preview?.toLowerCase().startsWith("reminder:"),
      ),
    );

    const cancelled = await request(
      base,
      jar,
      "DELETE",
      `/api/conversations/${conversationId}/reminders/${reminderId}`,
    );
    await expectJson(
      "DELETE /api/conversations/[id]/reminders/[reminderId]",
      cancelled,
      200,
      (data) => data.id === reminderId,
    );

    const afterCancel = await request(base, jar, "GET", `/api/conversations/${conversationId}/reminders`);
    await expectJson("GET /api/conversations/[id]/reminders after cancel", afterCancel, 200, (data) =>
      Boolean(!data.reminders?.some((item) => item.id === reminderId)),
    );
  });

  await step("conversation snooze", async () => {
    const remindAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const noteText = `Snooze smoke ${Date.now()}`;

    const created = await request(base, jar, "POST", `/api/conversations/${conversationId}/reminders`, {
      note: noteText,
      remindAt,
    });
    const createdChecked = await expectJson(
      "POST /api/conversations/[id]/reminders for snooze",
      created,
      200,
      (data) => Boolean(data.reminder?.id && data.message?.from === "reminder"),
    );
    const reminderId = createdChecked.data.reminder.id;

    const hidden = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations hides snoozed", hidden, 200, (data) =>
      Boolean(!data.conversations?.some((item) => item.id === conversationId)),
    );

    const included = await request(base, jar, "GET", "/api/conversations?includeSnoozed=1");
    await expectJson("GET /api/conversations?includeSnoozed=1", included, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === conversationId);
      return Boolean(
        conversation?.snoozedUntil && new Date(conversation.snoozedUntil).getTime() > Date.now(),
      );
    });

    const cancelled = await request(
      base,
      jar,
      "DELETE",
      `/api/conversations/${conversationId}/reminders/${reminderId}`,
    );
    await expectJson(
      "DELETE /api/conversations/[id]/reminders/[reminderId] unsnooze",
      cancelled,
      200,
      (data) => data.id === reminderId,
    );

    const restored = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations after unsnooze", restored, 200, (data) =>
      Boolean(data.conversations?.some((item) => item.id === conversationId)),
    );
  });

  await step("reminder due processing", async () => {
    const remindAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const noteText = `Due processing smoke ${Date.now()}`;

    const created = await request(base, jar, "POST", `/api/conversations/${conversationId}/reminders`, {
      note: noteText,
      remindAt,
    });
    const createdChecked = await expectJson(
      "POST /api/conversations/[id]/reminders for due processing",
      created,
      200,
      (data) => Boolean(data.reminder?.id),
    );
    const reminderId = createdChecked.data.reminder.id;

    const hidden = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations hides until due", hidden, 200, (data) =>
      Boolean(!data.conversations?.some((item) => item.id === conversationId)),
    );

    const asOf = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const processed = await request(base, jar, "POST", "/api/inbox/process-due-reminders", {
      asOf,
    });
    await expectJson("POST /api/inbox/process-due-reminders", processed, 200, (data) =>
      Boolean(
        data.processedCount === 1 &&
          data.conversationIds?.includes(conversationId) &&
          data.conversations?.some(
            (item) => item.id === conversationId && item.unread >= 1 && item.preview?.includes(noteText),
          ),
      ),
    );

    const restored = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations after reminder due", restored, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === conversationId);
      return Boolean(conversation && conversation.unread >= 1);
    });

    const reminders = await request(base, jar, "GET", `/api/conversations/${conversationId}/reminders`);
    await expectJson(
      "GET /api/conversations/[id]/reminders excludes fulfilled",
      reminders,
      200,
      (data) => Boolean(!data.reminders?.some((item) => item.id === reminderId)),
    );

    const again = await request(base, jar, "POST", "/api/inbox/process-due-reminders", { asOf });
    await expectJson("POST /api/inbox/process-due-reminders idempotent", again, 200, (data) =>
      Boolean(data.processedCount === 0),
    );
  });

  await step("note author", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson(
      "GET /api/auth/session for note author",
      session,
      200,
      (data) => Boolean(data.user?.id && data.user?.name),
    );
    const operatorId = sessionChecked.data.user.id;

    const noteText = `Note author smoke ${Date.now()}`;
    const created = await request(base, jar, "POST", `/api/conversations/${conversationId}/notes`, {
      text: noteText,
    });
    await expectJson("POST /api/conversations/[id]/notes author", created, 200, (data) =>
      Boolean(
        data.message?.from === "note" &&
          data.message?.text === noteText &&
          data.message?.author?.id === operatorId &&
          typeof data.message?.author?.name === "string" &&
          typeof data.message?.author?.avatarGradient === "string" &&
          data.message.author.name.length > 0,
      ),
    );

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] note author", detail, 200, (data) =>
      Boolean(
        data.messages?.some(
          (message) =>
            message.from === "note" &&
            message.text === noteText &&
            message.author?.id === operatorId &&
            typeof message.author?.name === "string" &&
            typeof message.author?.avatarGradient === "string",
        ),
      ),
    );

    const polled = await request(
      base,
      jar,
      "GET",
      `/api/conversations/${conversationId}/messages?after=-1`,
    );
    await expectJson("GET /api/conversations/[id]/messages note author", polled, 200, (data) =>
      Boolean(
        data.messages?.some(
          (message) =>
            message.from === "note" &&
            message.text === noteText &&
            message.author?.id === operatorId &&
            typeof message.author?.avatarGradient === "string",
        ),
      ),
    );
  });

  await step("note author avatar", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson(
      "GET /api/auth/session for note author avatar",
      session,
      200,
      (data) => Boolean(data.user?.id && data.user?.avatarGradient),
    );
    const operatorId = sessionChecked.data.user.id;
    const avatarGradient = sessionChecked.data.user.avatarGradient;

    const noteText = `Note avatar smoke ${Date.now()}`;
    const created = await request(base, jar, "POST", `/api/conversations/${conversationId}/notes`, {
      text: noteText,
    });
    await expectJson("POST /api/conversations/[id]/notes author avatar", created, 200, (data) =>
      Boolean(
        data.message?.author?.id === operatorId &&
          data.message?.author?.avatarGradient === avatarGradient,
      ),
    );
  });

  await step("delete note", async () => {
    const noteText = `Delete note smoke ${Date.now()}`;
    const created = await request(base, jar, "POST", `/api/conversations/${conversationId}/notes`, {
      text: noteText,
    });
    const createdData = await expectJson("POST /api/conversations/[id]/notes for delete", created, 200, (data) =>
      Boolean(data.message?.from === "note" && data.message?.id),
    );
    const noteId = createdData.data.message.id;

    const beforeDelete = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] before delete note", beforeDelete, 200, (data) =>
      Boolean(data.messages?.some((message) => message.id === noteId)),
    );

    const removed = await request(
      base,
      jar,
      "DELETE",
      `/api/conversations/${conversationId}/notes/${noteId}`,
    );
    await expectJson("DELETE /api/conversations/[id]/notes/[messageId]", removed, 200, (data) =>
      Boolean(data.messageId === noteId && data.conversation?.id === conversationId),
    );

    const afterDelete = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    const afterDeleteChecked = await expectJson(
      "GET /api/conversations/[id] after delete note",
      afterDelete,
      200,
      (data) => Boolean(!data.messages?.some((message) => message.id === noteId)),
    );

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations after delete note", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === conversationId);
      return Boolean(conversation && !conversation.preview?.includes(noteText));
    });

    const operatorMessage = afterDeleteChecked.data.messages?.find(
      (message) => message.from === "operator",
    );
    if (!operatorMessage) {
      throw new Error("No operator message available to test non-note delete rejection");
    }

    const invalid = await request(
      base,
      jar,
      "DELETE",
      `/api/conversations/${conversationId}/notes/${operatorMessage.id}`,
    );
    if (invalid.response.status !== 400) {
      throw new Error(
        `DELETE non-note message expected 400, got ${invalid.response.status}`,
      );
    }

    const missing = await request(
      base,
      jar,
      "DELETE",
      `/api/conversations/${conversationId}/notes/not-a-real-note-id`,
    );
    if (missing.response.status !== 404) {
      throw new Error(`DELETE missing note expected 404, got ${missing.response.status}`);
    }
  });

  await step("edit note", async () => {
    const originalText = `Edit note original ${Date.now()}`;
    const created = await request(base, jar, "POST", `/api/conversations/${conversationId}/notes`, {
      text: originalText,
    });
    const createdData = await expectJson("POST /api/conversations/[id]/notes for edit", created, 200, (data) =>
      Boolean(data.message?.from === "note" && data.message?.id),
    );
    const noteId = createdData.data.message.id;

    const updatedText = `Edit note updated ${Date.now()}`;
    const patched = await request(
      base,
      jar,
      "PATCH",
      `/api/conversations/${conversationId}/notes/${noteId}`,
      { text: updatedText },
    );
    await expectJson("PATCH /api/conversations/[id]/notes/[messageId]", patched, 200, (data) =>
      Boolean(
        data.message?.id === noteId &&
          data.message?.text === updatedText &&
          data.conversation?.preview?.includes(updatedText),
      ),
    );

    const detail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    const detailChecked = await expectJson(
      "GET /api/conversations/[id] after edit note",
      detail,
      200,
      (data) =>
        Boolean(
          data.messages?.some(
            (message) =>
              message.id === noteId && message.from === "note" && message.text === updatedText,
          ),
        ),
    );

    const empty = await request(
      base,
      jar,
      "PATCH",
      `/api/conversations/${conversationId}/notes/${noteId}`,
      { text: "   " },
    );
    if (empty.response.status !== 400) {
      throw new Error(`PATCH empty note expected 400, got ${empty.response.status}`);
    }

    const operatorMessage = detailChecked.data.messages?.find(
      (message) => message.from === "operator",
    );
    if (!operatorMessage) {
      throw new Error("No operator message available to test non-note edit rejection");
    }

    const invalid = await request(
      base,
      jar,
      "PATCH",
      `/api/conversations/${conversationId}/notes/${operatorMessage.id}`,
      { text: "Cannot edit operator message" },
    );
    if (invalid.response.status !== 400) {
      throw new Error(`PATCH non-note message expected 400, got ${invalid.response.status}`);
    }
  });

  await step("triage runtime", async () => {
    const sortMatch = `triage-segment-${Date.now()}`;
    const dropMatch = `triage-drop-${Date.now()}`;
    const resolveMatch = `triage-resolve-${Date.now()}`;

    const sortRule = await request(base, jar, "POST", "/api/triage-rules", {
      ruleset: "sort",
      name: "Smoke assign segment",
      action: "Assign Segment",
      matchContains: sortMatch,
    });
    const sortRuleChecked = await expectJson(
      "POST /api/triage-rules sort runtime",
      sortRule,
      201,
      (data) => Boolean(data.rule?.action === "Assign Segment"),
    );
    const sortRuleId = sortRuleChecked.data.rule.id;

    const blockRule = await request(base, jar, "POST", "/api/triage-rules", {
      ruleset: "block",
      name: "Smoke drop message",
      action: "Drop Message",
      matchContains: dropMatch,
    });
    const blockRuleChecked = await expectJson(
      "POST /api/triage-rules block runtime",
      blockRule,
      201,
      (data) => Boolean(data.rule?.action === "Drop Message"),
    );
    const blockRuleId = blockRuleChecked.data.rule.id;

    const resolveRule = await request(base, jar, "POST", "/api/triage-rules", {
      ruleset: "sort",
      name: "Smoke resolve conversation",
      action: "Resolve Conversation",
      matchContains: resolveMatch,
    });
    const resolveRuleChecked = await expectJson(
      "POST /api/triage-rules resolve runtime",
      resolveRule,
      201,
      (data) => Boolean(data.rule?.action === "Resolve Conversation"),
    );
    const resolveRuleId = resolveRuleChecked.data.rule.id;

    const beforeDrop = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    const beforeDropChecked = await expectJson(
      "GET /api/conversations/[id] before triage drop",
      beforeDrop,
      200,
      (data) => Array.isArray(data.messages),
    );
    const messageCountBeforeDrop = beforeDropChecked.data.messages.length;

    const dropped = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${conversationId}/visitor-messages`,
      { text: `Please ${dropMatch} this message` },
    );
    await expectJson("POST /api/conversations/[id]/visitor-messages triage drop", dropped, 200, (data) =>
      Boolean(
        data.dropped === true &&
          data.message === null &&
          data.triage?.block?.action === "Drop Message",
      ),
    );

    const afterDrop = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] after triage drop", afterDrop, 200, (data) =>
      data.messages?.length === messageCountBeforeDrop,
    );

    const segmented = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${conversationId}/visitor-messages`,
      { text: `Customer says ${sortMatch} please help` },
    );
    await expectJson(
      "POST /api/conversations/[id]/visitor-messages triage segment",
      segmented,
      200,
      (data) =>
        Boolean(
          data.message?.from === "visitor" &&
            Array.isArray(data.triage?.sort?.appliedActions) &&
            data.triage.sort.appliedActions.some((action) => action === `segment:${sortMatch}`),
        ),
    );

    const segmentDetail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] triage segment", segmentDetail, 200, (data) =>
      Boolean(data.details?.segments?.includes(sortMatch)),
    );

    await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      status: "pending",
    });

    const resolved = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${conversationId}/visitor-messages`,
      { text: `Closing with ${resolveMatch}` },
    );
    await expectJson(
      "POST /api/conversations/[id]/visitor-messages triage resolve",
      resolved,
      200,
      (data) => Boolean(data.conversation?.status === "resolved"),
    );

    await request(base, jar, "DELETE", `/api/triage-rules/${sortRuleId}`);
    await request(base, jar, "DELETE", `/api/triage-rules/${blockRuleId}`);
    await request(base, jar, "DELETE", `/api/triage-rules/${resolveRuleId}`);
  });

  await step("triage spam and data", async () => {
    const spamMatch = `triage-spam-${Date.now()}`;
    const dataMatch = `triage-data-${Date.now()}`;
    const dataKey = dataMatch.toLowerCase().replace(/[^a-z0-9_]+/g, "_");

    const spamRule = await request(base, jar, "POST", "/api/triage-rules", {
      ruleset: "block",
      name: "Smoke send to spam",
      action: "Send to Spam",
      matchContains: spamMatch,
    });
    const spamRuleChecked = await expectJson(
      "POST /api/triage-rules spam runtime",
      spamRule,
      201,
      (data) => Boolean(data.rule?.action === "Send to Spam"),
    );
    const spamRuleId = spamRuleChecked.data.rule.id;

    const dataRule = await request(base, jar, "POST", "/api/triage-rules", {
      ruleset: "sort",
      name: "Smoke set data value",
      action: "Set Data Value",
      matchContains: dataMatch,
    });
    const dataRuleChecked = await expectJson(
      "POST /api/triage-rules data runtime",
      dataRule,
      201,
      (data) => Boolean(data.rule?.action === "Set Data Value"),
    );
    const dataRuleId = dataRuleChecked.data.rule.id;

    const beforeSpam = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    const beforeSpamChecked = await expectJson(
      "GET /api/conversations/[id] before triage spam",
      beforeSpam,
      200,
      (data) => Array.isArray(data.messages),
    );
    const messageCountBeforeSpam = beforeSpamChecked.data.messages.length;

    const spamMessageText = `Automated ${spamMatch} notification`;
    const spammed = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${conversationId}/visitor-messages`,
      { text: spamMessageText },
    );
    await expectJson(
      "POST /api/conversations/[id]/visitor-messages triage spam",
      spammed,
      200,
      (data) =>
        Boolean(
          data.message?.from === "visitor" &&
            data.message?.text === spamMessageText &&
            data.triage?.block?.action === "Send to Spam",
        ),
    );

    const afterSpam = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] triage spam segment", afterSpam, 200, (data) =>
      Boolean(
        data.messages?.length === messageCountBeforeSpam + 1 &&
          data.details?.segments?.includes("spam"),
      ),
    );

    const dataMessageText = `Customer reference ${dataMatch} for lookup`;
    const dataTagged = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${conversationId}/visitor-messages`,
      { text: dataMessageText },
    );
    await expectJson(
      "POST /api/conversations/[id]/visitor-messages triage data",
      dataTagged,
      200,
      (data) =>
        Boolean(
          data.message?.from === "visitor" &&
            Array.isArray(data.triage?.sort?.appliedActions) &&
            data.triage.sort.appliedActions.some((action) => action === `data:${dataKey}`),
        ),
    );

    const dataDetail = await request(base, jar, "GET", `/api/conversations/${conversationId}`);
    await expectJson("GET /api/conversations/[id] triage visitor data", dataDetail, 200, (data) =>
      Boolean(
        data.details?.visitorData?.some(
          (entry) => entry.key === dataKey && entry.value === dataMessageText,
        ),
      ),
    );

    await request(base, jar, "DELETE", `/api/triage-rules/${spamRuleId}`);
    await request(base, jar, "DELETE", `/api/triage-rules/${dataRuleId}`);
  });

  await step("seeded triage rules", async () => {
    const rules = await request(base, jar, "GET", "/api/triage-rules");
    const rulesChecked = await expectJson("GET /api/triage-rules seeded", rules, 200, (data) =>
      Boolean(
        data.rules?.some(
          (rule) =>
            rule.ruleset === "block" &&
            rule.action === "Send to Spam" &&
            rule.matchContains === "noreply" &&
            rule.enabled === true,
        ) &&
          data.rules?.some(
            (rule) =>
              rule.ruleset === "sort" &&
              rule.action === "Assign Segment" &&
              rule.matchContains === "vip" &&
              rule.enabled === true,
          ),
      ),
    );

    const noreplyRule = rulesChecked.data.rules.find(
      (rule) => rule.matchContains === "noreply" && rule.action === "Send to Spam",
    );
    const vipRule = rulesChecked.data.rules.find(
      (rule) => rule.matchContains === "vip" && rule.action === "Assign Segment",
    );
    if (!noreplyRule || !vipRule) {
      throw new Error("Seeded triage rules noreply/vip not found");
    }

    const list = await request(base, jar, "GET", "/api/conversations");
    const listChecked = await expectJson(
      "GET /api/conversations for seeded triage",
      list,
      200,
      (data) => Boolean(data.conversations?.some((item) => item.id === "c2")),
    );
    const triageConversationId =
      listChecked.data.conversations.find((item) => item.id === "c2")?.id ?? "c2";

    const spamText = `Automated noreply notification ${Date.now()}`;
    const spammed = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${triageConversationId}/visitor-messages`,
      { text: spamText },
    );
    await expectJson(
      "POST /api/conversations/[id]/visitor-messages seeded noreply spam",
      spammed,
      200,
      (data) =>
        Boolean(
          data.message?.from === "visitor" &&
            data.message?.text === spamText &&
            data.triage?.block?.action === "Send to Spam",
        ),
    );

    const spamDetail = await request(base, jar, "GET", `/api/conversations/${triageConversationId}`);
    await expectJson("GET /api/conversations/[id] seeded spam segment", spamDetail, 200, (data) =>
      Boolean(data.details?.segments?.includes("spam")),
    );

    const vipText = `I am a vip member ${Date.now()}`;
    const vipTagged = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${triageConversationId}/visitor-messages`,
      { text: vipText },
    );
    await expectJson(
      "POST /api/conversations/[id]/visitor-messages seeded vip segment",
      vipTagged,
      200,
      (data) =>
        Boolean(
          data.message?.from === "visitor" &&
            Array.isArray(data.triage?.sort?.appliedActions) &&
            data.triage.sort.appliedActions.includes("segment:vip"),
        ),
    );

    const vipDetail = await request(base, jar, "GET", `/api/conversations/${triageConversationId}`);
    await expectJson("GET /api/conversations/[id] seeded vip segment", vipDetail, 200, (data) =>
      Boolean(data.details?.segments?.includes("vip")),
    );
  });

  await step("show snoozed preference", async () => {
    const CUSTOMIZE_SLUG = "inbox/customize";
    const SHOW_SNOOZED_KEY = "1-7";

    const initial = await request(base, jar, "GET", `/api/settings/${CUSTOMIZE_SLUG}`);
    await expectJson(
      "GET /api/settings/inbox/customize show snoozed default",
      initial,
      200,
      (data) => Boolean(data.toggles?.[SHOW_SNOOZED_KEY] === false),
    );

    const enabled = await request(base, jar, "PATCH", `/api/settings/${CUSTOMIZE_SLUG}`, {
      key: SHOW_SNOOZED_KEY,
      on: true,
    });
    await expectJson(
      "PATCH /api/settings/inbox/customize show snoozed",
      enabled,
      200,
      (data) => Boolean(data.key === SHOW_SNOOZED_KEY && data.on === true),
    );

    const remindAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const created = await request(base, jar, "POST", `/api/conversations/${conversationId}/reminders`, {
      note: `Show snoozed pref ${Date.now()}`,
      remindAt,
    });
    const createdChecked = await expectJson(
      "POST /api/conversations/[id]/reminders show snoozed pref",
      created,
      200,
      (data) => Boolean(data.reminder?.id),
    );
    const reminderId = createdChecked.data.reminder.id;

    const defaultList = await request(base, jar, "GET", "/api/conversations");
    await expectJson(
      "GET /api/conversations still hides snoozed without param",
      defaultList,
      200,
      (data) => Boolean(!data.conversations?.some((item) => item.id === conversationId)),
    );

    const withSnoozed = await request(base, jar, "GET", "/api/conversations?includeSnoozed=1");
    await expectJson(
      "GET /api/conversations?includeSnoozed=1 for show snoozed pref",
      withSnoozed,
      200,
      (data) => {
        const conversation = data.conversations?.find((item) => item.id === conversationId);
        return Boolean(
          conversation?.snoozedUntil &&
            new Date(conversation.snoozedUntil).getTime() > Date.now(),
        );
      },
    );

    await request(
      base,
      jar,
      "DELETE",
      `/api/conversations/${conversationId}/reminders/${reminderId}`,
    );

    const disabled = await request(base, jar, "PATCH", `/api/settings/${CUSTOMIZE_SLUG}`, {
      key: SHOW_SNOOZED_KEY,
      on: false,
    });
    await expectJson(
      "PATCH /api/settings/inbox/customize hide snoozed",
      disabled,
      200,
      (data) => Boolean(data.key === SHOW_SNOOZED_KEY && data.on === false),
    );
  });

  await step("note author permissions", async () => {
    const noteText = `Author permissions smoke ${Date.now()}`;
    const created = await request(base, jar, "POST", `/api/conversations/${conversationId}/notes`, {
      text: noteText,
    });
    const createdData = await expectJson(
      "POST /api/conversations/[id]/notes for author permissions",
      created,
      200,
      (data) => Boolean(data.message?.from === "note" && data.message?.id),
    );
    const noteId = createdData.data.message.id;

    const otherJar = new Map();
    const otherLogin = await request(base, otherJar, "POST", "/api/auth/login", {
      email: SEED_OPERATOR2_EMAIL,
      password: SEED_PASSWORD,
    });
    const otherLoginChecked = await expectJson(
      "POST /api/auth/login secondary operator",
      otherLogin,
      200,
      (data) => Boolean(data.user?.email === SEED_OPERATOR2_EMAIL && data.workspace?.id),
    );
    const otherSessionJar = otherLoginChecked.jar;

    const forbiddenEdit = await request(
      base,
      otherSessionJar,
      "PATCH",
      `/api/conversations/${conversationId}/notes/${noteId}`,
      { text: "Unauthorized edit attempt" },
    );
    await expectStatus(
      "PATCH /api/conversations/[id]/notes/[messageId] non-author",
      forbiddenEdit,
      403,
    );

    const forbiddenDelete = await request(
      base,
      otherSessionJar,
      "DELETE",
      `/api/conversations/${conversationId}/notes/${noteId}`,
    );
    await expectStatus(
      "DELETE /api/conversations/[id]/notes/[messageId] non-author",
      forbiddenDelete,
      403,
    );

    const updatedText = `Author permissions updated ${Date.now()}`;
    const allowedEdit = await request(
      base,
      jar,
      "PATCH",
      `/api/conversations/${conversationId}/notes/${noteId}`,
      { text: updatedText },
    );
    await expectJson(
      "PATCH /api/conversations/[id]/notes/[messageId] author",
      allowedEdit,
      200,
      (data) => Boolean(data.message?.id === noteId && data.message?.text === updatedText),
    );

    const removed = await request(
      base,
      jar,
      "DELETE",
      `/api/conversations/${conversationId}/notes/${noteId}`,
    );
    await expectJson(
      "DELETE /api/conversations/[id]/notes/[messageId] author",
      removed,
      200,
      (data) => Boolean(data.messageId === noteId),
    );
  });

  await step("list assignee avatar", async () => {
    const CUSTOMIZE_SLUG = "inbox/customize";
    const SHOW_ASSIGNEE_KEY = "1-6";

    const initial = await request(base, jar, "GET", `/api/settings/${CUSTOMIZE_SLUG}`);
    await expectJson("GET /api/settings/inbox/customize show assignee default", initial, 200, (data) =>
      Boolean(data.toggles?.[SHOW_ASSIGNEE_KEY] === false),
    );

    const enabled = await request(base, jar, "PATCH", `/api/settings/${CUSTOMIZE_SLUG}`, {
      key: SHOW_ASSIGNEE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/inbox/customize show assignee", enabled, 200, (data) =>
      Boolean(data.key === SHOW_ASSIGNEE_KEY && data.on === true),
    );

    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson(
      "GET /api/auth/session for list assignee",
      session,
      200,
      (data) => Boolean(data.user?.id),
    );
    const operatorId = sessionChecked.data.user.id;

    const assign = await request(base, jar, "PATCH", `/api/conversations/c1`, {
      assignedOperatorId: operatorId,
    });
    await expectJson("PATCH /api/conversations/c1 list assignee", assign, 200, (data) =>
      Boolean(
        data.conversation?.id === "c1" &&
          data.conversation?.assignee?.id === operatorId &&
          typeof data.conversation?.assignee?.avatarGradient === "string",
      ),
    );

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations list assignee", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === "c1");
      return Boolean(
        conversation?.assignee?.id === operatorId &&
          typeof conversation?.assignee?.name === "string" &&
          typeof conversation?.assignee?.avatarGradient === "string",
      );
    });

    const disabled = await request(base, jar, "PATCH", `/api/settings/${CUSTOMIZE_SLUG}`, {
      key: SHOW_ASSIGNEE_KEY,
      on: false,
    });
    await expectJson(
      "PATCH /api/settings/inbox/customize hide assignee",
      disabled,
      200,
      (data) => Boolean(data.key === SHOW_ASSIGNEE_KEY && data.on === false),
    );
  });

  await step("list assignee name", async () => {
    const session = await request(base, jar, "GET", "/api/auth/session");
    const sessionChecked = await expectJson(
      "GET /api/auth/session for list assignee name",
      session,
      200,
      (data) => Boolean(data.user?.id && data.user?.name),
    );
    const operatorId = sessionChecked.data.user.id;
    const operatorName = sessionChecked.data.user.name;

    const assign = await request(base, jar, "PATCH", `/api/conversations/c1`, {
      assignedOperatorId: operatorId,
    });
    await expectJson("PATCH /api/conversations/c1 list assignee name", assign, 200, (data) =>
      Boolean(
        data.conversation?.assignee?.id === operatorId &&
          data.conversation?.assignee?.name === operatorName,
      ),
    );

    const detail = await request(base, jar, "GET", `/api/conversations/c1`);
    await expectJson("GET /api/conversations/c1 list assignee name", detail, 200, (data) =>
      data.conversation?.assignee?.name === operatorName,
    );

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations list assignee name", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === "c1");
      return conversation?.assignee?.name === operatorName;
    });
  });

  await step("simulate visitor stack", async () => {
    const reset = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      status: "pending",
      unread: 0,
    });
    await expectJson("PATCH /api/conversations/[id] reset visitor stack", reset, 200, (data) =>
      data.conversation?.unread === 0,
    );

    const firstText = `Visitor stack one ${Date.now()}`;
    const first = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${conversationId}/visitor-messages`,
      { text: firstText },
    );
    await expectJson("POST /api/conversations/[id]/visitor-messages first", first, 200, (data) =>
      Boolean(
        data.message?.from === "visitor" &&
          data.message.text === firstText &&
          data.conversation?.unread === 1 &&
          data.conversation?.preview === firstText,
      ),
    );

    const secondText = `Visitor stack two ${Date.now()}`;
    const second = await request(
      base,
      jar,
      "POST",
      `/api/conversations/${conversationId}/visitor-messages`,
      { text: secondText },
    );
    await expectJson("POST /api/conversations/[id]/visitor-messages second", second, 200, (data) =>
      Boolean(
        data.message?.from === "visitor" &&
          data.message.text === secondText &&
          data.conversation?.unread === 2 &&
          data.conversation?.preview === secondText,
      ),
    );

    const list = await request(base, jar, "GET", "/api/conversations");
    await expectJson("GET /api/conversations visitor stack", list, 200, (data) => {
      const conversation = data.conversations?.find((item) => item.id === conversationId);
      return conversation?.unread === 2 && conversation?.preview === secondText;
    });

    const markRead = await request(base, jar, "PATCH", `/api/conversations/${conversationId}`, {
      unread: 0,
    });
    await expectJson("PATCH /api/conversations/[id] clear visitor stack unread", markRead, 200, (data) =>
      data.conversation?.unread === 0,
    );
  });

  await step("poll messages", async () => {
    const result = await request(
      base,
      jar,
      "GET",
      `/api/conversations/${conversationId}/messages?after=0`,
    );
    await expectJson("GET /api/conversations/[id]/messages", result, 200, (data) =>
      Array.isArray(data.messages),
    );
  });

  await step("inbox stream realtime push", async () => {
    const stream = await openInboxStream(base, jar, conversationId);
    try {
      await stream.waitFor((event) => event.type === "connected");
      await stream.waitFor(
        (event) => event.type === "conversations" && event.conversations.length > 0,
      );

      const smokeText = `SSE smoke ${Date.now()}`;
      const post = await request(
        base,
        jar,
        "POST",
        `/api/conversations/${conversationId}/messages`,
        { text: smokeText },
      );
      await expectJson("POST /api/conversations/[id]/messages during SSE", post, 200, (data) =>
        Boolean(data.message?.text === smokeText),
      );

      await stream.waitFor(
        (event) =>
          event.type === "messages" &&
          event.conversationId === conversationId &&
          event.messages.some((message) => message.text === smokeText),
      );
    } finally {
      await stream.close();
    }
  });

  await step("visitors", async () => {
    const result = await request(base, jar, "GET", "/api/visitors");
    await expectJson("GET /api/visitors", result, 200, (data) =>
      Array.isArray(data.visitors) && typeof data.stats === "object",
    );
  });

  await step("contacts", async () => {
    const result = await request(base, jar, "GET", "/api/contacts");
    await expectJson("GET /api/contacts", result, 200, (data) =>
      Array.isArray(data.contacts) && typeof data.total === "number",
    );
  });

  await step("campaigns", async () => {
    const result = await request(base, jar, "GET", "/api/campaigns");
    await expectJson("GET /api/campaigns", result, 200, (data) =>
      Array.isArray(data.campaigns) && typeof data.counts === "object",
    );
  });

  await step("helpdesk", async () => {
    const result = await request(base, jar, "GET", "/api/helpdesk");
    await expectJson("GET /api/helpdesk", result, 200, (data) =>
      Array.isArray(data.articles) && typeof data.helpdeskEnabled === "boolean",
    );
  });

  await step("analytics", async () => {
    const result = await request(base, jar, "GET", "/api/analytics");
    await expectJson("GET /api/analytics", result, 200, (data) =>
      typeof data.kpis === "object" && typeof data.analyticsEnabled === "boolean",
    );
  });

  await step("plugins", async () => {
    const result = await request(base, jar, "GET", "/api/plugins");
    const checked = await expectJson("GET /api/plugins", result, 200, (data) =>
      Array.isArray(data.plugins) && data.plugins.length > 0,
    );
    const pluginId = checked.data.plugins[0]?.id;
    if (!pluginId) throw new Error("No plugins in catalog");

    const patch = await request(base, jar, "PATCH", `/api/plugins/${pluginId}`, {
      installed: true,
    });
    await expectJson("PATCH /api/plugins/[id]", patch, 200, (data) =>
      Boolean(data.plugin?.id === pluginId && data.plugin.installed === true),
    );
  });

  await step("settings", async () => {
    const result = await request(base, jar, "GET", `/api/settings/${settingsSlug}`);
    await expectJson("GET /api/settings/[...slug]", result, 200, (data) =>
      typeof data.toggles === "object",
    );
  });

  await step("account notifications", async () => {
    const NOTIFICATIONS_SLUG = "account/notifications";
    const SOUNDS_KEY = "0-4";

    const initial = await request(base, jar, "GET", `/api/settings/${NOTIFICATIONS_SLUG}`);
    await expectJson("GET /api/settings/account/notifications", initial, 200, (data) =>
      Boolean(data.toggles?.[SOUNDS_KEY] === true),
    );

    const updated = await request(base, jar, "PATCH", `/api/settings/${NOTIFICATIONS_SLUG}`, {
      key: SOUNDS_KEY,
      on: false,
    });
    await expectJson("PATCH /api/settings/account/notifications", updated, 200, (data) =>
      Boolean(data.key === SOUNDS_KEY && data.on === false),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson("GET /api/auth/session before notification switch", sessionResult, 200);
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for notification switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for notifications",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const afterSwitch = await request(base, jar, "GET", `/api/settings/${NOTIFICATIONS_SLUG}`);
    await expectJson(
      "GET /api/settings/account/notifications after workspace switch",
      afterSwitch,
      200,
      (data) => Boolean(data.toggles?.[SOUNDS_KEY] === false),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore notifications", restoredWorkspace, 200)).jar;

    const restoredToggle = await request(base, jar, "PATCH", `/api/settings/${NOTIFICATIONS_SLUG}`, {
      key: SOUNDS_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/account/notifications restore", restoredToggle, 200, (data) =>
      Boolean(data.on === true),
    );
  });

  await step("account interface", async () => {
    const INTERFACE_SLUG = "account/interface";

    const initial = await request(base, jar, "GET", `/api/settings/${INTERFACE_SLUG}`);
    await expectJson("GET /api/settings/account/interface", initial, 200, (data) =>
      Boolean(data.fields?.language === "Auto-Detect" && data.fields?.appearance === "Light Mode"),
    );

    const updatedLanguage = await request(base, jar, "PATCH", `/api/settings/${INTERFACE_SLUG}`, {
      key: "language",
      value: "English",
    });
    await expectJson("PATCH /api/settings/account/interface language", updatedLanguage, 200, (data) =>
      Boolean(data.key === "language" && data.value === "English"),
    );

    const updatedAppearance = await request(base, jar, "PATCH", `/api/settings/${INTERFACE_SLUG}`, {
      key: "appearance",
      value: "Dark Mode",
    });
    await expectJson(
      "PATCH /api/settings/account/interface appearance",
      updatedAppearance,
      200,
      (data) => Boolean(data.key === "appearance" && data.value === "Dark Mode"),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson("GET /api/auth/session before interface switch", sessionResult, 200);
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for interface switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for interface",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const afterSwitch = await request(base, jar, "GET", `/api/settings/${INTERFACE_SLUG}`);
    await expectJson(
      "GET /api/settings/account/interface after workspace switch",
      afterSwitch,
      200,
      (data) =>
        Boolean(data.fields?.language === "English" && data.fields?.appearance === "Dark Mode"),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore interface", restoredWorkspace, 200)).jar;

    await request(base, jar, "PATCH", `/api/settings/${INTERFACE_SLUG}`, {
      key: "language",
      value: "Auto-Detect",
    });
    await request(base, jar, "PATCH", `/api/settings/${INTERFACE_SLUG}`, {
      key: "appearance",
      value: "Light Mode",
    });
  });

  await step("account shortcuts", async () => {
    const SHORTCUTS_SLUG = "account/shortcuts";
    const SEARCH_KEY = "0-0";

    const initial = await request(base, jar, "GET", `/api/settings/${SHORTCUTS_SLUG}`);
    await expectJson("GET /api/settings/account/shortcuts", initial, 200, (data) =>
      Boolean(data.toggles?.[SEARCH_KEY] === true),
    );

    const updated = await request(base, jar, "PATCH", `/api/settings/${SHORTCUTS_SLUG}`, {
      key: SEARCH_KEY,
      on: false,
    });
    await expectJson("PATCH /api/settings/account/shortcuts", updated, 200, (data) =>
      Boolean(data.key === SEARCH_KEY && data.on === false),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson("GET /api/auth/session before shortcuts switch", sessionResult, 200);
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for shortcuts switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for shortcuts",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const afterSwitch = await request(base, jar, "GET", `/api/settings/${SHORTCUTS_SLUG}`);
    await expectJson(
      "GET /api/settings/account/shortcuts after workspace switch",
      afterSwitch,
      200,
      (data) => Boolean(data.toggles?.[SEARCH_KEY] === false),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore shortcuts", restoredWorkspace, 200)).jar;

    const restoredToggle = await request(base, jar, "PATCH", `/api/settings/${SHORTCUTS_SLUG}`, {
      key: SEARCH_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/account/shortcuts restore", restoredToggle, 200, (data) =>
      Boolean(data.on === true),
    );
  });

  await step("message shortcuts", async () => {
    const initial = await request(base, jar, "GET", "/api/message-shortcuts");
    const initialChecked = await expectJson(
      "GET /api/message-shortcuts",
      initial,
      200,
      (data) => Array.isArray(data.shortcuts) && data.shortcuts.length >= 2,
    );

    const created = await request(base, jar, "POST", "/api/message-shortcuts", {
      bang: "!smoketest",
      tag: "qa",
      message: "Smoke test shortcut message",
    });
    const createdChecked = await expectJson(
      "POST /api/message-shortcuts",
      created,
      201,
      (data) => Boolean(data.shortcut?.bang === "!smoketest"),
    );
    const shortcutId = createdChecked.data.shortcut.id;

    const updated = await request(base, jar, "PATCH", `/api/message-shortcuts/${shortcutId}`, {
      message: "Updated smoke shortcut message",
    });
    await expectJson(
      "PATCH /api/message-shortcuts/[id]",
      updated,
      200,
      (data) => Boolean(data.shortcut?.message === "Updated smoke shortcut message"),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson("GET /api/auth/session before shortcut switch", sessionResult, 200);
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for message shortcut switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for message shortcuts",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", "/api/message-shortcuts");
    await expectJson(
      "GET /api/message-shortcuts isolated workspace",
      isolated,
      200,
      (data) => Boolean(!data.shortcuts?.some((shortcut) => shortcut.id === shortcutId)),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore shortcuts", restoredWorkspace, 200)).jar;

    const deleted = await request(base, jar, "DELETE", `/api/message-shortcuts/${shortcutId}`);
    await expectJson("DELETE /api/message-shortcuts/[id]", deleted, 200, (data) => data.id === shortcutId);

    const afterDelete = await request(base, jar, "GET", "/api/message-shortcuts");
    await expectJson(
      "GET /api/message-shortcuts after delete",
      afterDelete,
      200,
      (data) =>
        Boolean(
          data.shortcuts?.length === initialChecked.data.shortcuts.length &&
            !data.shortcuts?.some((shortcut) => shortcut.id === shortcutId),
        ),
    );
  });

  await step("inbox customize", async () => {
    const CUSTOMIZE_SLUG = "inbox/customize";
    const SHOW_CHANNEL_KEY = "1-2";
    const EMAIL_PREVIEW_FIELD = "emailPreview";

    const initial = await request(base, jar, "GET", `/api/settings/${CUSTOMIZE_SLUG}`);
    await expectJson("GET /api/settings/inbox/customize", initial, 200, (data) =>
      Boolean(
        data.toggles?.[SHOW_CHANNEL_KEY] === false &&
          data.fields?.[EMAIL_PREVIEW_FIELD] === "Automatic",
      ),
    );

    const updatedToggle = await request(base, jar, "PATCH", `/api/settings/${CUSTOMIZE_SLUG}`, {
      key: SHOW_CHANNEL_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/inbox/customize toggle", updatedToggle, 200, (data) =>
      Boolean(data.key === SHOW_CHANNEL_KEY && data.on === true),
    );

    const updatedField = await request(base, jar, "PATCH", `/api/settings/${CUSTOMIZE_SLUG}`, {
      key: EMAIL_PREVIEW_FIELD,
      value: "Always show as text",
    });
    await expectJson("PATCH /api/settings/inbox/customize field", updatedField, 200, (data) =>
      Boolean(data.key === EMAIL_PREVIEW_FIELD && data.value === "Always show as text"),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before customize switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for inbox customize switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for inbox customize",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", `/api/settings/${CUSTOMIZE_SLUG}`);
    await expectJson(
      "GET /api/settings/inbox/customize isolated workspace",
      isolated,
      200,
      (data) =>
        Boolean(
          data.toggles?.[SHOW_CHANNEL_KEY] === false &&
            data.fields?.[EMAIL_PREVIEW_FIELD] === "Automatic",
        ),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore customize", restoredWorkspace, 200))
      .jar;

    const afterRestore = await request(base, jar, "GET", `/api/settings/${CUSTOMIZE_SLUG}`);
    await expectJson(
      "GET /api/settings/inbox/customize after restore",
      afterRestore,
      200,
      (data) =>
        Boolean(
          data.toggles?.[SHOW_CHANNEL_KEY] === true &&
            data.fields?.[EMAIL_PREVIEW_FIELD] === "Always show as text",
        ),
    );

    await request(base, jar, "PATCH", `/api/settings/${CUSTOMIZE_SLUG}`, {
      key: SHOW_CHANNEL_KEY,
      on: false,
    });
    await request(base, jar, "PATCH", `/api/settings/${CUSTOMIZE_SLUG}`, {
      key: EMAIL_PREVIEW_FIELD,
      value: "Automatic",
    });
  });

  await step("inbox triage", async () => {
    const initial = await request(base, jar, "GET", "/api/triage-rules");
    const initialChecked = await expectJson(
      "GET /api/triage-rules",
      initial,
      200,
      (data) => Array.isArray(data.rules) && data.rules.length >= 2,
    );

    const created = await request(base, jar, "POST", "/api/triage-rules", {
      ruleset: "block",
      name: "Smoke block rule",
      action: "Drop Message",
      matchContains: "smoke-test",
    });
    const createdChecked = await expectJson(
      "POST /api/triage-rules",
      created,
      201,
      (data) => Boolean(data.rule?.name === "Smoke block rule"),
    );
    const ruleId = createdChecked.data.rule.id;

    const updated = await request(base, jar, "PATCH", `/api/triage-rules/${ruleId}`, {
      enabled: false,
    });
    await expectJson(
      "PATCH /api/triage-rules/[id]",
      updated,
      200,
      (data) => Boolean(data.rule?.enabled === false),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson("GET /api/auth/session before triage switch", sessionResult, 200);
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for triage switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for triage",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", "/api/triage-rules");
    await expectJson(
      "GET /api/triage-rules isolated workspace",
      isolated,
      200,
      (data) => Boolean(!data.rules?.some((rule) => rule.id === ruleId)),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore triage", restoredWorkspace, 200)).jar;

    const deleted = await request(base, jar, "DELETE", `/api/triage-rules/${ruleId}`);
    await expectJson("DELETE /api/triage-rules/[id]", deleted, 200, (data) => data.id === ruleId);

    const afterDelete = await request(base, jar, "GET", "/api/triage-rules");
    await expectJson(
      "GET /api/triage-rules after delete",
      afterDelete,
      200,
      (data) =>
        Boolean(
          data.rules?.length === initialChecked.data.rules.length &&
            !data.rules?.some((rule) => rule.id === ruleId),
        ),
    );
  });

  await step("inbox sub-inboxes", async () => {
    const initial = await request(base, jar, "GET", "/api/sub-inboxes");
    const initialChecked = await expectJson(
      "GET /api/sub-inboxes",
      initial,
      200,
      (data) => Array.isArray(data.subInboxes) && data.subInboxes.length >= 2,
    );

    const created = await request(base, jar, "POST", "/api/sub-inboxes", {
      name: "Smoke sub-inbox",
      segment: "smoke-test",
    });
    const createdChecked = await expectJson(
      "POST /api/sub-inboxes",
      created,
      201,
      (data) => Boolean(data.subInbox?.name === "Smoke sub-inbox"),
    );
    const subInboxId = createdChecked.data.subInbox.id;

    const updated = await request(base, jar, "PATCH", `/api/sub-inboxes/${subInboxId}`, {
      enabled: false,
    });
    await expectJson(
      "PATCH /api/sub-inboxes/[id]",
      updated,
      200,
      (data) => Boolean(data.subInbox?.enabled === false),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson("GET /api/auth/session before sub-inbox switch", sessionResult, 200);
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for sub-inbox switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for sub-inboxes",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", "/api/sub-inboxes");
    await expectJson(
      "GET /api/sub-inboxes isolated workspace",
      isolated,
      200,
      (data) => Boolean(!data.subInboxes?.some((subInbox) => subInbox.id === subInboxId)),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore sub-inboxes", restoredWorkspace, 200)).jar;

    const deleted = await request(base, jar, "DELETE", `/api/sub-inboxes/${subInboxId}`);
    await expectJson("DELETE /api/sub-inboxes/[id]", deleted, 200, (data) => data.id === subInboxId);

    const afterDelete = await request(base, jar, "GET", "/api/sub-inboxes");
    await expectJson(
      "GET /api/sub-inboxes after delete",
      afterDelete,
      200,
      (data) =>
        Boolean(
          data.subInboxes?.length === initialChecked.data.subInboxes.length &&
            !data.subInboxes?.some((subInbox) => subInbox.id === subInboxId),
        ),
    );
  });

  await step("inbox routing", async () => {
    const ROUTING_SLUG = "inbox/routing";
    const ENABLE_RULES_KEY = "1-0";

    const settings = await request(base, jar, "GET", `/api/settings/${ROUTING_SLUG}`);
    await expectJson(
      "GET /api/settings/inbox/routing",
      settings,
      200,
      (data) => data.pageSlug === ROUTING_SLUG && typeof data.toggles?.[ENABLE_RULES_KEY] === "boolean",
    );

    const enabled = await request(base, jar, "PATCH", `/api/settings/${ROUTING_SLUG}`, {
      key: ENABLE_RULES_KEY,
      on: true,
    });
    await expectJson(
      "PATCH /api/settings/inbox/routing enable rules",
      enabled,
      200,
      (data) => Boolean(data.key === ENABLE_RULES_KEY && data.on === true),
    );

    const initial = await request(base, jar, "GET", "/api/routing-rules");
    const initialChecked = await expectJson(
      "GET /api/routing-rules",
      initial,
      200,
      (data) => Array.isArray(data.rules) && data.rules.length >= 2,
    );

    const created = await request(base, jar, "POST", "/api/routing-rules", {
      name: "Smoke routing rule",
      action: "Assign to Operator",
      assignTarget: "Support",
      matchContains: "smoke-test",
    });
    const createdChecked = await expectJson(
      "POST /api/routing-rules",
      created,
      201,
      (data) => Boolean(data.rule?.name === "Smoke routing rule"),
    );
    const ruleId = createdChecked.data.rule.id;

    const updated = await request(base, jar, "PATCH", `/api/routing-rules/${ruleId}`, {
      enabled: false,
    });
    await expectJson(
      "PATCH /api/routing-rules/[id]",
      updated,
      200,
      (data) => Boolean(data.rule?.enabled === false),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before routing switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for routing switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for routing",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", "/api/routing-rules");
    await expectJson(
      "GET /api/routing-rules isolated workspace",
      isolated,
      200,
      (data) => Boolean(!data.rules?.some((rule) => rule.id === ruleId)),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore routing", restoredWorkspace, 200)).jar;

    const deleted = await request(base, jar, "DELETE", `/api/routing-rules/${ruleId}`);
    await expectJson("DELETE /api/routing-rules/[id]", deleted, 200, (data) => data.id === ruleId);

    const afterDelete = await request(base, jar, "GET", "/api/routing-rules");
    await expectJson(
      "GET /api/routing-rules after delete",
      afterDelete,
      200,
      (data) =>
        Boolean(
          data.rules?.length === initialChecked.data.rules.length &&
            !data.rules?.some((rule) => rule.id === ruleId),
        ),
    );
  });

  await step("chatbox appearance", async () => {
    const APPEARANCE_SLUG = "chatbox/appearance";
    const COLOR_THEME_FIELD = "colorTheme";
    const LOGO_TOGGLE_KEY = "1-0";

    jar = await resetAlternateWorkspaceChatboxAppearance(base, jar);

    await request(base, jar, "PATCH", `/api/settings/${APPEARANCE_SLUG}`, {
      key: COLOR_THEME_FIELD,
      value: "Default (Blue)",
    });
    await request(base, jar, "PATCH", `/api/settings/${APPEARANCE_SLUG}`, {
      key: LOGO_TOGGLE_KEY,
      on: false,
    });

    const initial = await request(base, jar, "GET", `/api/settings/${APPEARANCE_SLUG}`);
    await expectJson("GET /api/settings/chatbox/appearance", initial, 200, (data) =>
      Boolean(
        data.pageSlug === APPEARANCE_SLUG &&
          data.fields?.[COLOR_THEME_FIELD] === "Default (Blue)" &&
          data.toggles?.["1-2"] === true,
      ),
    );

    const updatedField = await request(base, jar, "PATCH", `/api/settings/${APPEARANCE_SLUG}`, {
      key: COLOR_THEME_FIELD,
      value: "Emerald",
    });
    await expectJson("PATCH /api/settings/chatbox/appearance field", updatedField, 200, (data) =>
      Boolean(data.key === COLOR_THEME_FIELD && data.value === "Emerald"),
    );

    const updatedToggle = await request(base, jar, "PATCH", `/api/settings/${APPEARANCE_SLUG}`, {
      key: LOGO_TOGGLE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/chatbox/appearance toggle", updatedToggle, 200, (data) =>
      Boolean(data.key === LOGO_TOGGLE_KEY && data.on === true),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before appearance switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for chatbox appearance switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for chatbox appearance",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", `/api/settings/${APPEARANCE_SLUG}`);
    await expectJson(
      "GET /api/settings/chatbox/appearance isolated workspace",
      isolated,
      200,
      (data) =>
        Boolean(
          data.fields?.[COLOR_THEME_FIELD] === "Default (Blue)" &&
            data.toggles?.[LOGO_TOGGLE_KEY] === false,
        ),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore appearance", restoredWorkspace, 200))
      .jar;

    const afterRestore = await request(base, jar, "GET", `/api/settings/${APPEARANCE_SLUG}`);
    await expectJson(
      "GET /api/settings/chatbox/appearance after restore",
      afterRestore,
      200,
      (data) =>
        Boolean(
          data.fields?.[COLOR_THEME_FIELD] === "Emerald" &&
            data.toggles?.[LOGO_TOGGLE_KEY] === true,
        ),
    );
  });

  await step("chatbox behavior", async () => {
    const BEHAVIOR_SLUG = "chatbox/behavior";
    const DEFAULT_SECTION_FIELD = "defaultSection";
    const ASK_EMAIL_TOGGLE_KEY = "1-0";

    await request(base, jar, "PATCH", `/api/settings/${BEHAVIOR_SLUG}`, {
      key: DEFAULT_SECTION_FIELD,
      value: "Messages (default)",
    });
    await request(base, jar, "PATCH", `/api/settings/${BEHAVIOR_SLUG}`, {
      key: ASK_EMAIL_TOGGLE_KEY,
      on: true,
    });

    const initial = await request(base, jar, "GET", `/api/settings/${BEHAVIOR_SLUG}`);
    await expectJson("GET /api/settings/chatbox/behavior", initial, 200, (data) =>
      Boolean(
        data.pageSlug === BEHAVIOR_SLUG &&
          data.fields?.[DEFAULT_SECTION_FIELD] === "Messages (default)" &&
          data.toggles?.[ASK_EMAIL_TOGGLE_KEY] === true,
      ),
    );

    const updatedField = await request(base, jar, "PATCH", `/api/settings/${BEHAVIOR_SLUG}`, {
      key: DEFAULT_SECTION_FIELD,
      value: "Home",
    });
    await expectJson("PATCH /api/settings/chatbox/behavior field", updatedField, 200, (data) =>
      Boolean(data.key === DEFAULT_SECTION_FIELD && data.value === "Home"),
    );

    const updatedToggle = await request(base, jar, "PATCH", `/api/settings/${BEHAVIOR_SLUG}`, {
      key: ASK_EMAIL_TOGGLE_KEY,
      on: false,
    });
    await expectJson("PATCH /api/settings/chatbox/behavior toggle", updatedToggle, 200, (data) =>
      Boolean(data.key === ASK_EMAIL_TOGGLE_KEY && data.on === false),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before behavior switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for chatbox behavior switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for chatbox behavior",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", `/api/settings/${BEHAVIOR_SLUG}`);
    await expectJson(
      "GET /api/settings/chatbox/behavior isolated workspace",
      isolated,
      200,
      (data) =>
        Boolean(
          data.fields?.[DEFAULT_SECTION_FIELD] === "Messages (default)" &&
            data.toggles?.[ASK_EMAIL_TOGGLE_KEY] === true,
        ),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore behavior", restoredWorkspace, 200))
      .jar;

    const afterRestore = await request(base, jar, "GET", `/api/settings/${BEHAVIOR_SLUG}`);
    await expectJson(
      "GET /api/settings/chatbox/behavior after restore",
      afterRestore,
      200,
      (data) =>
        Boolean(
          data.fields?.[DEFAULT_SECTION_FIELD] === "Home" &&
            data.toggles?.[ASK_EMAIL_TOGGLE_KEY] === false,
        ),
    );
  });

  await step("chatbox search ai", async () => {
    const SEARCH_AI_SLUG = "chatbox/search-ai";
    const OVERLAY_PLUGIN_ID = "overlay";
    const ENABLE_TOGGLE_KEY = "0-0";
    const DIRECT_TOGGLE_KEY = "0-1";
    const DEFAULT_LANGUAGE_FIELD = "defaultLanguage";

    const installedOverlay = await request(base, jar, "PATCH", `/api/plugins/${OVERLAY_PLUGIN_ID}`, {
      installed: true,
    });
    await expectJson("PATCH /api/plugins/overlay install", installedOverlay, 200, (data) =>
      Boolean(data.plugin?.installed === true),
    );

    await request(base, jar, "PATCH", `/api/settings/${SEARCH_AI_SLUG}`, {
      key: ENABLE_TOGGLE_KEY,
      on: false,
    });
    await request(base, jar, "PATCH", `/api/settings/${SEARCH_AI_SLUG}`, {
      key: DIRECT_TOGGLE_KEY,
      on: false,
    });
    await request(base, jar, "PATCH", `/api/settings/${SEARCH_AI_SLUG}`, {
      key: DEFAULT_LANGUAGE_FIELD,
      value: "Default language",
    });

    const initialSettings = await request(base, jar, "GET", `/api/settings/${SEARCH_AI_SLUG}`);
    await expectJson("GET /api/settings/chatbox/search-ai", initialSettings, 200, (data) =>
      Boolean(
        data.pageSlug === SEARCH_AI_SLUG &&
          data.toggles?.[ENABLE_TOGGLE_KEY] === false &&
          data.fields?.[DEFAULT_LANGUAGE_FIELD] === "Default language",
      ),
    );

    const initialSearches = await request(base, jar, "GET", "/api/search-ai/frequent-searches");
    await expectJson("GET /api/search-ai/frequent-searches", initialSearches, 200, (data) =>
      Boolean(data.overlayInstalled === true && Array.isArray(data.searches)),
    );

    const enabled = await request(base, jar, "PATCH", `/api/settings/${SEARCH_AI_SLUG}`, {
      key: ENABLE_TOGGLE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/chatbox/search-ai enable", enabled, 200, (data) =>
      Boolean(data.key === ENABLE_TOGGLE_KEY && data.on === true),
    );

    const directed = await request(base, jar, "PATCH", `/api/settings/${SEARCH_AI_SLUG}`, {
      key: DIRECT_TOGGLE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/chatbox/search-ai direct", directed, 200, (data) =>
      Boolean(data.key === DIRECT_TOGGLE_KEY && data.on === true),
    );

    const updatedLanguage = await request(base, jar, "PATCH", `/api/settings/${SEARCH_AI_SLUG}`, {
      key: DEFAULT_LANGUAGE_FIELD,
      value: "English",
    });
    await expectJson(
      "PATCH /api/settings/chatbox/search-ai language",
      updatedLanguage,
      200,
      (data) => Boolean(data.key === DEFAULT_LANGUAGE_FIELD && data.value === "English"),
    );

    const created = await request(base, jar, "POST", "/api/search-ai/frequent-searches", {
      query: "How do refunds work?",
    });
    const createdChecked = await expectJson(
      "POST /api/search-ai/frequent-searches",
      created,
      201,
      (data) => Boolean(data.search?.query === "How do refunds work?"),
    );
    const searchId = createdChecked.data.search.id;

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before search-ai switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for search-ai switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for search-ai",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", "/api/search-ai/frequent-searches");
    await expectJson(
      "GET /api/search-ai/frequent-searches isolated workspace",
      isolated,
      200,
      (data) => Boolean(!data.searches?.some((search) => search.id === searchId)),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore search-ai", restoredWorkspace, 200))
      .jar;

    const deleted = await request(base, jar, "DELETE", `/api/search-ai/frequent-searches/${searchId}`);
    await expectJson("DELETE /api/search-ai/frequent-searches/[id]", deleted, 200, (data) =>
      Boolean(data.id === searchId),
    );

    const afterDelete = await request(base, jar, "GET", "/api/search-ai/frequent-searches");
    await expectJson(
      "GET /api/search-ai/frequent-searches after delete",
      afterDelete,
      200,
      (data) => Boolean(!data.searches?.some((search) => search.id === searchId)),
    );
  });

  await step("chatbox security", async () => {
    const SECURITY_SLUG = "chatbox/security";
    const DOMAIN_LOCK_TOGGLE_KEY = "0-0";

    await request(base, jar, "PATCH", `/api/settings/${SECURITY_SLUG}`, {
      key: DOMAIN_LOCK_TOGGLE_KEY,
      on: false,
    });

    const initial = await request(base, jar, "GET", `/api/settings/${SECURITY_SLUG}`);
    await expectJson("GET /api/settings/chatbox/security", initial, 200, (data) =>
      Boolean(
        data.pageSlug === SECURITY_SLUG && data.toggles?.[DOMAIN_LOCK_TOGGLE_KEY] === false,
      ),
    );

    const updated = await request(base, jar, "PATCH", `/api/settings/${SECURITY_SLUG}`, {
      key: DOMAIN_LOCK_TOGGLE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/chatbox/security", updated, 200, (data) =>
      Boolean(data.key === DOMAIN_LOCK_TOGGLE_KEY && data.on === true),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before security switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for chatbox security switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for chatbox security",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", `/api/settings/${SECURITY_SLUG}`);
    await expectJson(
      "GET /api/settings/chatbox/security isolated workspace",
      isolated,
      200,
      (data) => Boolean(data.toggles?.[DOMAIN_LOCK_TOGGLE_KEY] === false),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore security", restoredWorkspace, 200))
      .jar;

    const afterRestore = await request(base, jar, "GET", `/api/settings/${SECURITY_SLUG}`);
    await expectJson(
      "GET /api/settings/chatbox/security after restore",
      afterRestore,
      200,
      (data) => Boolean(data.toggles?.[DOMAIN_LOCK_TOGGLE_KEY] === true),
    );

    await request(base, jar, "PATCH", `/api/settings/${SECURITY_SLUG}`, {
      key: DOMAIN_LOCK_TOGGLE_KEY,
      on: false,
    });
  });

  await step("chatbox restrictions", async () => {
    const RESTRICTIONS_SLUG = "chatbox/restrictions";
    const VACATION_TOGGLE_KEY = "0-0";
    const smokeSuffix = Date.now();
    const allowedPageUrl = `https://www.example.com/support-${smokeSuffix}`;
    const blockedPageUrl = `https://www.example.com/hidden-${smokeSuffix}`;
    const blockedVisitorEmail = `blocked-${smokeSuffix}@example.com`;

    await request(base, jar, "PATCH", `/api/settings/${RESTRICTIONS_SLUG}`, {
      key: VACATION_TOGGLE_KEY,
      on: false,
    });

    const initialRestrictions = await request(base, jar, "GET", "/api/chatbox/restrictions");
    const initialRestrictionsData = await expectJson(
      "GET /api/chatbox/restrictions",
      initialRestrictions,
      200,
      (data) => Boolean(Array.isArray(data.restrictions) && data.restrictions.length >= 2),
    );
    const seededBlockedPages = initialRestrictionsData.data.restrictions.filter(
      (restriction) => restriction.kind === "blocked_page",
    );
    if (seededBlockedPages.length < 2) {
      throw new Error("Expected seeded blocked pages on primary workspace");
    }

    const createdAllowed = await request(base, jar, "POST", "/api/chatbox/restrictions", {
      kind: "allowed_page",
      value: allowedPageUrl,
    });
    const createdAllowedData = await expectJson(
      "POST /api/chatbox/restrictions allowed page",
      createdAllowed,
      201,
      (data) => Boolean(data.restriction?.kind === "allowed_page"),
    );

    const createdBlocked = await request(base, jar, "POST", "/api/chatbox/restrictions", {
      kind: "blocked_page",
      value: blockedPageUrl,
    });
    const createdBlockedData = await expectJson(
      "POST /api/chatbox/restrictions blocked page",
      createdBlocked,
      201,
      (data) => Boolean(data.restriction?.kind === "blocked_page"),
    );
    const createdBlockedId = createdBlockedData.data.restriction.id;

    const deletedBlocked = await request(
      base,
      jar,
      "DELETE",
      `/api/chatbox/restrictions/${createdBlockedId}`,
    );
    await expectJson(
      "DELETE /api/chatbox/restrictions/[id]",
      deletedBlocked,
      200,
      (data) => Boolean(data.id === createdBlockedId),
    );

    const createdVisitor = await request(base, jar, "POST", "/api/chatbox/restrictions", {
      kind: "blocked_visitor",
      value: blockedVisitorEmail,
    });
    await expectJson(
      "POST /api/chatbox/restrictions blocked visitor",
      createdVisitor,
      201,
      (data) => Boolean(data.restriction?.kind === "blocked_visitor"),
    );

    const clearedVisitors = await request(
      base,
      jar,
      "POST",
      "/api/chatbox/restrictions/clear-blocked-visitors",
    );
    await expectJson(
      "POST /api/chatbox/restrictions/clear-blocked-visitors",
      clearedVisitors,
      200,
      (data) => Boolean(data.cleared === true),
    );

    const afterClear = await request(base, jar, "GET", "/api/chatbox/restrictions");
    await expectJson(
      "GET /api/chatbox/restrictions after clear visitors",
      afterClear,
      200,
      (data) =>
        Boolean(!data.restrictions?.some((restriction) => restriction.kind === "blocked_visitor")),
    );

    const vacationOn = await request(base, jar, "PATCH", `/api/settings/${RESTRICTIONS_SLUG}`, {
      key: VACATION_TOGGLE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/chatbox/restrictions vacation", vacationOn, 200, (data) =>
      Boolean(data.key === VACATION_TOGGLE_KEY && data.on === true),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before restrictions switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for chatbox restrictions switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for chatbox restrictions",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolatedSettings = await request(base, jar, "GET", `/api/settings/${RESTRICTIONS_SLUG}`);
    await expectJson(
      "GET /api/settings/chatbox/restrictions isolated workspace",
      isolatedSettings,
      200,
      (data) => Boolean(data.toggles?.[VACATION_TOGGLE_KEY] === false),
    );

    const isolatedRestrictions = await request(base, jar, "GET", "/api/chatbox/restrictions");
    await expectJson(
      "GET /api/chatbox/restrictions isolated workspace",
      isolatedRestrictions,
      200,
      (data) =>
        Boolean(
          !data.restrictions?.some((restriction) => restriction.id === createdAllowedData.data.restriction.id),
        ),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (
      await expectJson("POST /api/auth/workspace restore restrictions", restoredWorkspace, 200)
    ).jar;

    const afterRestoreSettings = await request(
      base,
      jar,
      "GET",
      `/api/settings/${RESTRICTIONS_SLUG}`,
    );
    await expectJson(
      "GET /api/settings/chatbox/restrictions after restore",
      afterRestoreSettings,
      200,
      (data) => Boolean(data.toggles?.[VACATION_TOGGLE_KEY] === true),
    );

    const afterRestoreRestrictions = await request(base, jar, "GET", "/api/chatbox/restrictions");
    await expectJson(
      "GET /api/chatbox/restrictions after restore",
      afterRestoreRestrictions,
      200,
      (data) =>
        Boolean(
          data.restrictions?.some(
            (restriction) => restriction.id === createdAllowedData.data.restriction.id,
          ),
        ),
    );

    // Production safety: never leave vacation mode or smoke-only allowlists on the live workspace.
    const createdAllowedId = createdAllowedData.data.restriction.id;
    await request(base, jar, "DELETE", `/api/chatbox/restrictions/${createdAllowedId}`);
    await request(base, jar, "PATCH", `/api/settings/${RESTRICTIONS_SLUG}`, {
      key: VACATION_TOGGLE_KEY,
      on: false,
    });
  });

  await step("chatbox push", async () => {
    const PUSH_SLUG = "chatbox/push";
    const ANDROID_TOGGLE_KEY = "0-0";
    const IOS_TOGGLE_KEY = "1-0";

    await request(base, jar, "PATCH", `/api/settings/${PUSH_SLUG}`, {
      key: ANDROID_TOGGLE_KEY,
      on: false,
    });
    await request(base, jar, "PATCH", `/api/settings/${PUSH_SLUG}`, {
      key: IOS_TOGGLE_KEY,
      on: false,
    });

    const initial = await request(base, jar, "GET", `/api/settings/${PUSH_SLUG}`);
    await expectJson("GET /api/settings/chatbox/push", initial, 200, (data) =>
      Boolean(
        data.pageSlug === PUSH_SLUG &&
          data.toggles?.[ANDROID_TOGGLE_KEY] === false &&
          data.toggles?.[IOS_TOGGLE_KEY] === false,
      ),
    );

    const androidOn = await request(base, jar, "PATCH", `/api/settings/${PUSH_SLUG}`, {
      key: ANDROID_TOGGLE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/chatbox/push android", androidOn, 200, (data) =>
      Boolean(data.key === ANDROID_TOGGLE_KEY && data.on === true),
    );

    const iosOn = await request(base, jar, "PATCH", `/api/settings/${PUSH_SLUG}`, {
      key: IOS_TOGGLE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/chatbox/push ios", iosOn, 200, (data) =>
      Boolean(data.key === IOS_TOGGLE_KEY && data.on === true),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before push switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for chatbox push switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for chatbox push",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", `/api/settings/${PUSH_SLUG}`);
    await expectJson(
      "GET /api/settings/chatbox/push isolated workspace",
      isolated,
      200,
      (data) =>
        Boolean(
          data.toggles?.[ANDROID_TOGGLE_KEY] === false && data.toggles?.[IOS_TOGGLE_KEY] === false,
        ),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore push", restoredWorkspace, 200)).jar;

    const afterRestore = await request(base, jar, "GET", `/api/settings/${PUSH_SLUG}`);
    await expectJson(
      "GET /api/settings/chatbox/push after restore",
      afterRestore,
      200,
      (data) =>
        Boolean(
          data.toggles?.[ANDROID_TOGGLE_KEY] === true && data.toggles?.[IOS_TOGGLE_KEY] === true,
        ),
    );
  });

  await step("email behavior", async () => {
    const EMAIL_BEHAVIOR_SLUG = "email/behavior";
    const TRANSCRIPTS_TOGGLE_KEY = "0-0";
    const RATINGS_TOGGLE_KEY = "0-1";
    const SPAM_TOGGLE_KEY = "0-2";
    const SIGNATURE_TOGGLE_KEY = "1-0";

    jar = await resetAlternateWorkspaceEmailBehavior(base, jar);

    await request(base, jar, "PATCH", `/api/settings/${EMAIL_BEHAVIOR_SLUG}`, {
      key: TRANSCRIPTS_TOGGLE_KEY,
      on: true,
    });
    await request(base, jar, "PATCH", `/api/settings/${EMAIL_BEHAVIOR_SLUG}`, {
      key: RATINGS_TOGGLE_KEY,
      on: true,
    });
    await request(base, jar, "PATCH", `/api/settings/${EMAIL_BEHAVIOR_SLUG}`, {
      key: SPAM_TOGGLE_KEY,
      on: true,
    });
    await request(base, jar, "PATCH", `/api/settings/${EMAIL_BEHAVIOR_SLUG}`, {
      key: SIGNATURE_TOGGLE_KEY,
      on: false,
    });

    const initial = await request(base, jar, "GET", `/api/settings/${EMAIL_BEHAVIOR_SLUG}`);
    await expectJson("GET /api/settings/email/behavior", initial, 200, (data) =>
      Boolean(
        data.pageSlug === EMAIL_BEHAVIOR_SLUG &&
          data.toggles?.[TRANSCRIPTS_TOGGLE_KEY] === true &&
          data.toggles?.[RATINGS_TOGGLE_KEY] === true &&
          data.toggles?.[SPAM_TOGGLE_KEY] === true &&
          data.toggles?.[SIGNATURE_TOGGLE_KEY] === false,
      ),
    );

    const updatedTranscripts = await request(base, jar, "PATCH", `/api/settings/${EMAIL_BEHAVIOR_SLUG}`, {
      key: TRANSCRIPTS_TOGGLE_KEY,
      on: false,
    });
    await expectJson(
      "PATCH /api/settings/email/behavior transcripts",
      updatedTranscripts,
      200,
      (data) => Boolean(data.key === TRANSCRIPTS_TOGGLE_KEY && data.on === false),
    );

    const updatedSignature = await request(base, jar, "PATCH", `/api/settings/${EMAIL_BEHAVIOR_SLUG}`, {
      key: SIGNATURE_TOGGLE_KEY,
      on: true,
    });
    await expectJson(
      "PATCH /api/settings/email/behavior signature",
      updatedSignature,
      200,
      (data) => Boolean(data.key === SIGNATURE_TOGGLE_KEY && data.on === true),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before email behavior switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for email behavior switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for email behavior",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", `/api/settings/${EMAIL_BEHAVIOR_SLUG}`);
    await expectJson(
      "GET /api/settings/email/behavior isolated workspace",
      isolated,
      200,
      (data) =>
        Boolean(
          data.toggles?.[TRANSCRIPTS_TOGGLE_KEY] === true &&
            data.toggles?.[SIGNATURE_TOGGLE_KEY] === false,
        ),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore email behavior", restoredWorkspace, 200))
      .jar;

    const afterRestore = await request(base, jar, "GET", `/api/settings/${EMAIL_BEHAVIOR_SLUG}`);
    await expectJson(
      "GET /api/settings/email/behavior after restore",
      afterRestore,
      200,
      (data) =>
        Boolean(
          data.toggles?.[TRANSCRIPTS_TOGGLE_KEY] === false &&
            data.toggles?.[SIGNATURE_TOGGLE_KEY] === true,
        ),
    );
  });

  await step("email domain", async () => {
    const EMAIL_DOMAIN_SLUG = "email/domain";
    const BASIC_FIELD = "basicDomain";
    const CUSTOM_FIELD = "customDomain";

    jar = await resetAlternateWorkspaceEmailDomain(base, jar);

    await request(base, jar, "PATCH", `/api/settings/${EMAIL_DOMAIN_SLUG}`, {
      key: BASIC_FIELD,
      value: "fabzop",
    });
    await request(base, jar, "PATCH", `/api/settings/${EMAIL_DOMAIN_SLUG}`, {
      key: CUSTOM_FIELD,
      value: "",
    });

    const initial = await request(base, jar, "GET", `/api/settings/${EMAIL_DOMAIN_SLUG}`);
    await expectJson("GET /api/settings/email/domain", initial, 200, (data) =>
      Boolean(
        data.pageSlug === EMAIL_DOMAIN_SLUG &&
          data.fields?.[BASIC_FIELD] === "fabzop" &&
          data.fields?.[CUSTOM_FIELD] === "",
      ),
    );

    const updatedBasic = await request(base, jar, "PATCH", `/api/settings/${EMAIL_DOMAIN_SLUG}`, {
      key: BASIC_FIELD,
      value: "myshop",
    });
    await expectJson("PATCH /api/settings/email/domain basic", updatedBasic, 200, (data) =>
      Boolean(data.key === BASIC_FIELD && data.value === "myshop"),
    );

    const updatedCustom = await request(base, jar, "PATCH", `/api/settings/${EMAIL_DOMAIN_SLUG}`, {
      key: CUSTOM_FIELD,
      value: "emails.example.com",
    });
    await expectJson("PATCH /api/settings/email/domain custom", updatedCustom, 200, (data) =>
      Boolean(data.key === CUSTOM_FIELD && data.value === "emails.example.com"),
    );

    const invalidBasic = await request(base, jar, "PATCH", `/api/settings/${EMAIL_DOMAIN_SLUG}`, {
      key: BASIC_FIELD,
      value: "INVALID SPACE",
    });
    await expectJson(
      "PATCH /api/settings/email/domain invalid basic",
      invalidBasic,
      400,
      (data) => Boolean(typeof data.error === "string"),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before email domain switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for email domain switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for email domain",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", `/api/settings/${EMAIL_DOMAIN_SLUG}`);
    await expectJson(
      "GET /api/settings/email/domain isolated workspace",
      isolated,
      200,
      (data) =>
        Boolean(data.fields?.[BASIC_FIELD] === "fabzop" && data.fields?.[CUSTOM_FIELD] === ""),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (await expectJson("POST /api/auth/workspace restore email domain", restoredWorkspace, 200))
      .jar;

    const afterRestore = await request(base, jar, "GET", `/api/settings/${EMAIL_DOMAIN_SLUG}`);
    await expectJson(
      "GET /api/settings/email/domain after restore",
      afterRestore,
      200,
      (data) =>
        Boolean(
          data.fields?.[BASIC_FIELD] === "myshop" &&
            data.fields?.[CUSTOM_FIELD] === "emails.example.com",
        ),
    );
  });

  await step("email delivery", async () => {
    const DELIVERY_SLUG = "email/delivery";
    const SMTP_TOGGLE_KEY = "1-0";

    jar = await resetAlternateWorkspaceEmailDelivery(base, jar);

    await request(base, jar, "PATCH", `/api/settings/${DELIVERY_SLUG}`, {
      key: SMTP_TOGGLE_KEY,
      on: false,
    });

    const initial = await request(base, jar, "GET", `/api/settings/${DELIVERY_SLUG}`);
    await expectJson("GET /api/settings/email/delivery", initial, 200, (data) =>
      Boolean(data.pageSlug === DELIVERY_SLUG && data.toggles?.[SMTP_TOGGLE_KEY] === false),
    );

    const updated = await request(base, jar, "PATCH", `/api/settings/${DELIVERY_SLUG}`, {
      key: SMTP_TOGGLE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/email/delivery smtp", updated, 200, (data) =>
      Boolean(data.key === SMTP_TOGGLE_KEY && data.on === true),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session before email delivery switch",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for email delivery switch test");
    }

    const switched = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: alternate.id,
    });
    const switchedChecked = await expectJson(
      "POST /api/auth/workspace for email delivery",
      switched,
      200,
      (data) => data.workspace?.id === alternate.id,
    );
    jar = switchedChecked.jar;

    const isolated = await request(base, jar, "GET", `/api/settings/${DELIVERY_SLUG}`);
    await expectJson(
      "GET /api/settings/email/delivery isolated workspace",
      isolated,
      200,
      (data) => Boolean(data.toggles?.[SMTP_TOGGLE_KEY] === false),
    );

    const restoredWorkspace = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: sessionData.data.workspace.id,
    });
    jar = (
      await expectJson("POST /api/auth/workspace restore email delivery", restoredWorkspace, 200)
    ).jar;

    const afterRestore = await request(base, jar, "GET", `/api/settings/${DELIVERY_SLUG}`);
    await expectJson(
      "GET /api/settings/email/delivery after restore",
      afterRestore,
      200,
      (data) => Boolean(data.toggles?.[SMTP_TOGGLE_KEY] === true),
    );
  });

  await step("billing plans", async () => {
    jar = await resetUserPaymentMethods(base, jar);
    jar = await resetAllWorkspacePlansFree(base, jar);

    const result = await request(base, jar, "GET", "/api/billing/plans");
    await expectJson("GET /api/billing/plans", result, 200, (data) =>
      Boolean(
        Array.isArray(data.plans) &&
          data.plans.length >= 2 &&
          data.monthlyTotalCents === 0 &&
          data.hasPaymentMethod === false,
      ),
    );
  });

  await step("billing cards", async () => {
    jar = await resetUserPaymentMethods(base, jar);

    const initial = await request(base, jar, "GET", "/api/billing/cards");
    await expectJson("GET /api/billing/cards", initial, 200, (data) =>
      Boolean(Array.isArray(data.cards) && data.cards.length === 0),
    );

    const created = await request(base, jar, "POST", "/api/billing/cards", {
      brand: "visa",
      last4: "4242",
      label: "Smoke Visa ending in 4242",
    });
    const createdChecked = await expectJson(
      "POST /api/billing/cards",
      created,
      201,
      (data) => Boolean(data.card?.last4 === "4242"),
    );
    const cardId = createdChecked.data.card.id;

    const listed = await request(base, jar, "GET", "/api/billing/cards");
    await expectJson("GET /api/billing/cards after create", listed, 200, (data) =>
      Boolean(data.cards?.length === 1 && data.cards[0]?.id === cardId),
    );

    const plans = await request(base, jar, "GET", "/api/billing/plans");
    await expectJson("GET /api/billing/plans with card", plans, 200, (data) =>
      Boolean(data.hasPaymentMethod === true),
    );

    const removed = await request(base, jar, "DELETE", `/api/billing/cards/${cardId}`);
    await expectJson("DELETE /api/billing/cards/[id]", removed, 200, (data) => data.id === cardId);

    const afterDelete = await request(base, jar, "GET", "/api/billing/cards");
    await expectJson("GET /api/billing/cards after delete", afterDelete, 200, (data) =>
      Boolean(data.cards?.length === 0),
    );
  });

  await step("billing invoices", async () => {
    jar = await resetUserInvoices(base, jar);

    const initial = await request(base, jar, "GET", "/api/billing/invoices");
    await expectJson("GET /api/billing/invoices", initial, 200, (data) =>
      Boolean(Array.isArray(data.invoices) && data.invoices.length === 0),
    );

    const created = await request(base, jar, "POST", "/api/billing/invoices", {
      invoiceNumber: `INV-SMOKE-${Date.now()}`,
      amountCents: 2900,
      status: "paid",
    });
    const createdChecked = await expectJson(
      "POST /api/billing/invoices",
      created,
      201,
      (data) => Boolean(data.invoice?.amountCents === 2900 && data.invoice?.status === "paid"),
    );
    const invoiceId = createdChecked.data.invoice.id;

    const listed = await request(base, jar, "GET", "/api/billing/invoices");
    await expectJson("GET /api/billing/invoices after create", listed, 200, (data) =>
      Boolean(data.invoices?.length === 1 && data.invoices[0]?.id === invoiceId),
    );

    const removed = await request(base, jar, "DELETE", `/api/billing/invoices/${invoiceId}`);
    await expectJson("DELETE /api/billing/invoices/[id]", removed, 200, (data) => data.id === invoiceId);

    const afterDelete = await request(base, jar, "GET", "/api/billing/invoices");
    await expectJson("GET /api/billing/invoices after delete", afterDelete, 200, (data) =>
      Boolean(data.invoices?.length === 0),
    );
  });

  await step("workspace integrations", async () => {
    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session for workspace integrations",
      sessionResult,
      200,
    );

    const result = await request(base, jar, "GET", "/api/workspaces/integrations");
    const integrationChecked = await expectJson("GET /api/workspaces/integrations", result, 200, (data) =>
      Boolean(
        data.workspaceId === sessionData.data.workspace.id &&
          data.htmlSnippet?.includes("BYBELT_CHAT") &&
          data.htmlSnippet?.includes(data.workspaceId) &&
          data.scriptUrl?.endsWith("/embed.js") &&
          Array.isArray(data.categories) &&
          data.categories.length >= 4 &&
          data.categories.some(
            (category) => category.title === "Website" && category.channels?.length >= 8,
          ),
      ),
    );

    const embedAuth = await request(base, jar, "GET", "/api/chatbox/embed");
    const embedChecked = await expectJson("GET /api/chatbox/embed for integrations", embedAuth, 200, (data) =>
      Boolean(data.htmlSnippet?.includes("/embed.js")),
    );
    if (integrationChecked.data.htmlSnippet !== embedChecked.data.htmlSnippet) {
      throw new Error("Integrations htmlSnippet does not match /api/chatbox/embed");
    }

    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for workspace integrations test");
    }

    const switched = await switchWorkspace(
      base,
      jar,
      alternate.id,
      "POST /api/auth/workspace for workspace integrations",
    );
    jar = switched.jar;

    const isolated = await request(base, jar, "GET", "/api/workspaces/integrations");
    await expectJson(
      "GET /api/workspaces/integrations isolated workspace",
      isolated,
      200,
      (data) => data.workspaceId === alternate.id,
    );

    const restored = await switchWorkspace(
      base,
      jar,
      sessionData.data.workspace.id,
      "POST /api/auth/workspace restore workspace integrations",
    );
    jar = restored.jar;
  });

  await step("workspace operators", async () => {
    const OPERATORS_SLUG = "workspace/operators";
    const PREVENT_REMOVE_KEY = "0-0";
    const FORCE_2FA_KEY = "0-1";

    const initial = await request(base, jar, "GET", `/api/settings/${OPERATORS_SLUG}`);
    await expectJson("GET /api/settings/workspace/operators", initial, 200, (data) =>
      Boolean(
        data.pageSlug === OPERATORS_SLUG &&
          data.toggles?.[PREVENT_REMOVE_KEY] === false &&
          data.toggles?.[FORCE_2FA_KEY] === false,
      ),
    );

    const toggled = await request(base, jar, "PATCH", `/api/settings/${OPERATORS_SLUG}`, {
      key: PREVENT_REMOVE_KEY,
      on: true,
    });
    await expectJson("PATCH /api/settings/workspace/operators prevent remove", toggled, 200, (data) =>
      Boolean(data.key === PREVENT_REMOVE_KEY && data.on === true),
    );

    const operators = await request(base, jar, "GET", "/api/workspaces/operators");
    const operatorsData = await expectJson("GET /api/workspaces/operators", operators, 200, (data) =>
      Boolean(
        Array.isArray(data.operators) &&
          data.operators.length >= 1 &&
          data.operators.some(
            (operator) => operator.email === SEED_EMAIL && operator.role === "Owner" && operator.self,
          ),
      ),
    );
    const ownerId = operatorsData.data.operators.find((operator) => operator.role === "Owner")?.userId;
    if (!ownerId) {
      throw new Error("No workspace owner found for operators test");
    }

    const unknownInvite = await request(base, jar, "POST", "/api/workspaces/operators", {
      email: "missing-operator@example.com",
    });
    await expectStatus("POST /api/workspaces/operators unknown email", unknownInvite, 404);

    const blockedDelete = await request(base, jar, "DELETE", `/api/workspaces/operators/${ownerId}`);
    await expectStatus("DELETE /api/workspaces/operators owner blocked", blockedDelete, 403);

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session for workspace operators",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for workspace operators test");
    }

    const switched = await switchWorkspace(
      base,
      jar,
      alternate.id,
      "POST /api/auth/workspace for workspace operators",
    );
    jar = switched.jar;

    const isolated = await request(base, jar, "GET", "/api/workspaces/operators");
    await expectJson(
      "GET /api/workspaces/operators isolated workspace",
      isolated,
      200,
      (data) => Boolean(data.operators?.length >= 1),
    );

    const restored = await switchWorkspace(
      base,
      jar,
      sessionData.data.workspace.id,
      "POST /api/auth/workspace restore workspace operators",
    );
    jar = restored.jar;

    const restoreToggle = await request(base, jar, "PATCH", `/api/settings/${OPERATORS_SLUG}`, {
      key: PREVENT_REMOVE_KEY,
      on: false,
    });
    await expectJson(
      "PATCH /api/settings/workspace/operators restore toggle",
      restoreToggle,
      200,
      (data) => Boolean(data.on === false),
    );
  });

  await step("workspace billing", async () => {
    jar = await resetUserPaymentMethods(base, jar);
    jar = await resetWorkspaceBillingPaymentMethod(base, jar);

    const initial = await request(base, jar, "GET", "/api/workspaces/billing");
    await expectJson("GET /api/workspaces/billing", initial, 200, (data) =>
      Boolean(
        data.paymentMethodId === null &&
          Array.isArray(data.cards) &&
          data.cards.length === 0 &&
          data.selectedCard === null,
      ),
    );

    const createdCard = await request(base, jar, "POST", "/api/billing/cards", {
      brand: "visa",
      last4: "1111",
      label: "Smoke Workspace Billing Card",
    });
    const createdCardData = await expectJson(
      "POST /api/billing/cards for workspace billing",
      createdCard,
      201,
      (data) => Boolean(data.card?.id),
    );
    const cardId = createdCardData.data.card.id;

    const selected = await request(base, jar, "PATCH", "/api/workspaces/billing", {
      paymentMethodId: cardId,
    });
    await expectJson("PATCH /api/workspaces/billing", selected, 200, (data) =>
      Boolean(data.paymentMethodId === cardId && data.selectedCard?.id === cardId),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session for workspace billing",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for workspace billing test");
    }

    const switched = await switchWorkspace(
      base,
      jar,
      alternate.id,
      "POST /api/auth/workspace for workspace billing",
    );
    jar = switched.jar;

    const isolated = await request(base, jar, "GET", "/api/workspaces/billing");
    await expectJson(
      "GET /api/workspaces/billing isolated workspace",
      isolated,
      200,
      (data) => Boolean(data.paymentMethodId === null && data.selectedCard === null),
    );

    const restored = await switchWorkspace(
      base,
      jar,
      sessionData.data.workspace.id,
      "POST /api/auth/workspace restore workspace billing",
    );
    jar = restored.jar;

    const afterRestore = await request(base, jar, "GET", "/api/workspaces/billing");
    await expectJson(
      "GET /api/workspaces/billing after restore",
      afterRestore,
      200,
      (data) => Boolean(data.paymentMethodId === cardId),
    );

    jar = await resetWorkspaceBillingPaymentMethod(base, jar);
    const removed = await request(base, jar, "DELETE", `/api/billing/cards/${cardId}`);
    await expectJson("DELETE /api/billing/cards after workspace billing", removed, 200);
  });

  await step("workspace transparency", async () => {
    const TRANSPARENCY_SLUG = "workspace/transparency";
    const COLLECT_LOGS_KEY = "0-0";

    await request(base, jar, "PATCH", `/api/settings/${TRANSPARENCY_SLUG}`, {
      key: COLLECT_LOGS_KEY,
      on: true,
    });

    const initialSettings = await request(base, jar, "GET", `/api/settings/${TRANSPARENCY_SLUG}`);
    await expectJson("GET /api/settings/workspace/transparency", initialSettings, 200, (data) =>
      Boolean(data.pageSlug === TRANSPARENCY_SLUG && data.toggles?.[COLLECT_LOGS_KEY] === true),
    );

    const toggled = await request(base, jar, "PATCH", `/api/settings/${TRANSPARENCY_SLUG}`, {
      key: COLLECT_LOGS_KEY,
      on: false,
    });
    await expectJson(
      "PATCH /api/settings/workspace/transparency collect logs",
      toggled,
      200,
      (data) => Boolean(data.key === COLLECT_LOGS_KEY && data.on === false),
    );

    const logs = await request(base, jar, "GET", "/api/workspaces/transparency");
    const logsData = await expectJson("GET /api/workspaces/transparency", logs, 200, (data) =>
      Boolean(
        Array.isArray(data.logs) &&
          data.logs.length >= 4 &&
          Array.isArray(data.operators) &&
          data.operators.length >= 1 &&
          Array.isArray(data.actions) &&
          data.actions.includes("Operator logged in"),
      ),
    );

    const filtered = await request(
      base,
      jar,
      "GET",
      "/api/workspaces/transparency?action=Operator%20logged%20in",
    );
    await expectJson(
      "GET /api/workspaces/transparency action filter",
      filtered,
      200,
      (data) =>
        Boolean(
          data.logs.length >= 2 &&
            data.logs.every((log) => log.action === "Operator logged in"),
        ),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session for workspace transparency",
      sessionResult,
      200,
    );
    const homeWorkspaceId = sessionData.data.workspace.id;

    const created = await request(base, jar, "POST", "/api/workspaces", {
      name: "Transparency Isolated Smoke",
      domain: `smoke-transparency-${Date.now()}.example.com`,
    });
    const createdData = await expectJson(
      "POST /api/workspaces transparency isolated",
      created,
      200,
      (data) => Boolean(data.workspace?.id),
    );
    jar = createdData.jar;
    const ephemeralWorkspaceId = createdData.data.workspace.id;

    const sessionAfterCreate = await request(base, jar, "GET", "/api/auth/session");
    await expectJson(
      "GET /api/auth/session transparency ephemeral",
      sessionAfterCreate,
      200,
      (data) => data.workspace?.id === ephemeralWorkspaceId,
    );

    const isolated = await request(base, jar, "GET", "/api/workspaces/transparency");
    await expectJson(
      "GET /api/workspaces/transparency isolated workspace",
      isolated,
      200,
      (data) => Boolean(Array.isArray(data.logs) && data.logs.length === 0),
    );

    const deleted = await request(base, jar, "DELETE", "/api/workspaces");
    jar = (await expectJson("DELETE /api/workspaces transparency ephemeral", deleted, 200)).jar;

    const restored = await switchWorkspace(
      base,
      jar,
      homeWorkspaceId,
      "POST /api/auth/workspace restore workspace transparency",
    );
    jar = restored.jar;

    const restoreToggle = await request(base, jar, "PATCH", `/api/settings/${TRANSPARENCY_SLUG}`, {
      key: COLLECT_LOGS_KEY,
      on: true,
    });
    await expectJson(
      "PATCH /api/settings/workspace/transparency restore toggle",
      restoreToggle,
      200,
      (data) => Boolean(data.on === true),
    );

    void logsData;
  });

  await step("workspace advanced", async () => {
    const ADVANCED_SLUG = "workspace/advanced";
    const IDENTITY_KEY = "3-0";

    await request(base, jar, "PATCH", `/api/settings/${ADVANCED_SLUG}`, {
      key: "defaultLanguage",
      value: "Do not use any fallback language",
    });
    await request(base, jar, "PATCH", `/api/settings/${ADVANCED_SLUG}`, {
      key: IDENTITY_KEY,
      on: false,
    });

    const existingTokens = await request(base, jar, "GET", "/api/workspaces/api-tokens");
    const tokenPayload = await existingTokens.response.json().catch(() => ({ tokens: [] }));
    for (const token of tokenPayload.tokens ?? []) {
      await request(base, jar, "DELETE", `/api/workspaces/api-tokens/${token.id}`);
    }

    const existingWebhooks = await request(base, jar, "GET", "/api/workspaces/webhooks");
    const webhookPayload = await existingWebhooks.response.json().catch(() => ({ webhooks: [] }));
    for (const webhook of webhookPayload.webhooks ?? []) {
      await request(base, jar, "DELETE", `/api/workspaces/webhooks/${webhook.id}`);
    }

    const initialSettings = await request(base, jar, "GET", `/api/settings/${ADVANCED_SLUG}`);
    await expectJson("GET /api/settings/workspace/advanced", initialSettings, 200, (data) =>
      Boolean(
        data.pageSlug === ADVANCED_SLUG &&
          data.fields?.defaultLanguage === "Do not use any fallback language" &&
          data.toggles?.[IDENTITY_KEY] === false,
      ),
    );

    const language = await request(base, jar, "PATCH", `/api/settings/${ADVANCED_SLUG}`, {
      key: "defaultLanguage",
      value: "English",
    });
    await expectJson("PATCH /api/settings/workspace/advanced default language", language, 200, (data) =>
      Boolean(data.key === "defaultLanguage" && data.value === "English"),
    );

    const identity = await request(base, jar, "PATCH", `/api/settings/${ADVANCED_SLUG}`, {
      key: IDENTITY_KEY,
      on: true,
    });
    await expectJson(
      "PATCH /api/settings/workspace/advanced identity verification",
      identity,
      200,
      (data) => Boolean(data.key === IDENTITY_KEY && data.on === true),
    );

    const tokensInitial = await request(base, jar, "GET", "/api/workspaces/api-tokens");
    await expectJson("GET /api/workspaces/api-tokens", tokensInitial, 200, (data) =>
      Boolean(Array.isArray(data.tokens) && data.tokens.length === 0),
    );

    const createdToken = await request(base, jar, "POST", "/api/workspaces/api-tokens", {
      label: "Smoke API Token",
    });
    const createdTokenData = await expectJson(
      "POST /api/workspaces/api-tokens",
      createdToken,
      201,
      (data) => Boolean(data.token?.id && data.token?.plainToken?.startsWith("bybelt_")),
    );
    const tokenId = createdTokenData.data.token.id;

    const tokensAfter = await request(base, jar, "GET", "/api/workspaces/api-tokens");
    await expectJson("GET /api/workspaces/api-tokens after create", tokensAfter, 200, (data) =>
      Boolean(data.tokens?.length === 1 && data.tokens[0]?.label === "Smoke API Token"),
    );

    const webhooksInitial = await request(base, jar, "GET", "/api/workspaces/webhooks");
    await expectJson("GET /api/workspaces/webhooks", webhooksInitial, 200, (data) =>
      Boolean(Array.isArray(data.webhooks) && data.webhooks.length === 0),
    );

    const createdWebhook = await request(base, jar, "POST", "/api/workspaces/webhooks", {
      url: "https://example.com/smoke-webhook",
    });
    const createdWebhookData = await expectJson(
      "POST /api/workspaces/webhooks",
      createdWebhook,
      201,
      (data) => Boolean(data.webhook?.id && data.webhook?.url.includes("smoke-webhook")),
    );
    const webhookId = createdWebhookData.data.webhook.id;

    const disabledWebhook = await request(
      base,
      jar,
      "PATCH",
      `/api/workspaces/webhooks/${webhookId}`,
      { enabled: false },
    );
    await expectJson("PATCH /api/workspaces/webhooks disable", disabledWebhook, 200, (data) =>
      Boolean(data.webhook?.enabled === false),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session for workspace advanced",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for workspace advanced test");
    }

    const switched = await switchWorkspace(
      base,
      jar,
      alternate.id,
      "POST /api/auth/workspace for workspace advanced",
    );
    jar = switched.jar;

    const isolatedTokens = await request(base, jar, "GET", "/api/workspaces/api-tokens");
    await expectJson(
      "GET /api/workspaces/api-tokens isolated workspace",
      isolatedTokens,
      200,
      (data) => Boolean(Array.isArray(data.tokens) && data.tokens.length === 0),
    );

    const restored = await switchWorkspace(
      base,
      jar,
      sessionData.data.workspace.id,
      "POST /api/auth/workspace restore workspace advanced",
    );
    jar = restored.jar;

    const removedWebhook = await request(
      base,
      jar,
      "DELETE",
      `/api/workspaces/webhooks/${webhookId}`,
    );
    await expectJson("DELETE /api/workspaces/webhooks", removedWebhook, 200);

    const removedToken = await request(base, jar, "DELETE", `/api/workspaces/api-tokens/${tokenId}`);
    await expectJson("DELETE /api/workspaces/api-tokens", removedToken, 200);

    const restoreLanguage = await request(base, jar, "PATCH", `/api/settings/${ADVANCED_SLUG}`, {
      key: "defaultLanguage",
      value: "Do not use any fallback language",
    });
    await expectJson(
      "PATCH /api/settings/workspace/advanced restore language",
      restoreLanguage,
      200,
      (data) => Boolean(data.value === "Do not use any fallback language"),
    );

    const restoreIdentity = await request(base, jar, "PATCH", `/api/settings/${ADVANCED_SLUG}`, {
      key: IDENTITY_KEY,
      on: false,
    });
    await expectJson(
      "PATCH /api/settings/workspace/advanced restore identity",
      restoreIdentity,
      200,
      (data) => Boolean(data.on === false),
    );
  });

async function resetWorkspaceDataState(base, jar) {
  await request(base, jar, "DELETE", "/api/workspaces/data/training");
  await request(base, jar, "DELETE", "/api/workspaces/data/contract");
  await request(base, jar, "PATCH", "/api/workspaces/data/limits", {
    key: "campaignRecipients",
    limit: 50,
  });
  return jar;
}

  await step("workspace data", async () => {
    jar = await resetWorkspaceDataState(base, jar);

    const initial = await request(base, jar, "GET", "/api/workspaces/data");
    await expectJson("GET /api/workspaces/data", initial, 200, (data) =>
      Boolean(
        data.training?.magicReplyNeverTrained === true &&
          Array.isArray(data.limits) &&
          data.limits.length === 3 &&
          data.limits.some(
            (limit) =>
              limit.key === "campaignRecipients" &&
              limit.limit === 50 &&
              limit.progress >= 0,
          ) &&
          data.limits.some(
            (limit) => limit.key === "operators" && limit.main.includes("/") && limit.progress >= 0,
          ) &&
          data.contract?.signed === false,
      ),
    );

    const trained = await request(base, jar, "POST", "/api/workspaces/data/training");
    await expectJson("POST /api/workspaces/data/training", trained, 200, (data) =>
      Boolean(data.training?.magicReplyNeverTrained === false && data.trainedAt),
    );

    const limitUpdated = await request(base, jar, "PATCH", "/api/workspaces/data/limits", {
      key: "campaignRecipients",
      limit: 75,
    });
    await expectJson("PATCH /api/workspaces/data/limits", limitUpdated, 200, (data) =>
      Boolean(data.key === "campaignRecipients" && data.limit === 75 && data.row?.limit === 75),
    );

    const signed = await request(base, jar, "POST", "/api/workspaces/data/contract");
    await expectJson("POST /api/workspaces/data/contract", signed, 200, (data) =>
      Boolean(data.contract?.signed === true && data.signedAt),
    );

    const sessionResult = await request(base, jar, "GET", "/api/auth/session");
    const sessionData = await expectJson(
      "GET /api/auth/session for workspace data",
      sessionResult,
      200,
    );
    const alternate = sessionData.data.workspaces.find(
      (workspace) => workspace.id !== sessionData.data.workspace.id,
    );
    if (!alternate) {
      throw new Error("No alternate workspace available for workspace data test");
    }

    const switched = await switchWorkspace(
      base,
      jar,
      alternate.id,
      "POST /api/auth/workspace for workspace data",
    );
    jar = switched.jar;

    const isolated = await request(base, jar, "GET", "/api/workspaces/data");
    await expectJson(
      "GET /api/workspaces/data isolated workspace",
      isolated,
      200,
      (data) => Boolean(data.training?.magicReplyNeverTrained === true && data.contract?.signed === false),
    );

    const restored = await switchWorkspace(
      base,
      jar,
      sessionData.data.workspace.id,
      "POST /api/auth/workspace restore workspace data",
    );
    jar = restored.jar;

    const afterRestore = await request(base, jar, "GET", "/api/workspaces/data");
    await expectJson(
      "GET /api/workspaces/data after restore",
      afterRestore,
      200,
      (data) =>
        Boolean(
          data.training?.magicReplyNeverTrained === false &&
            data.contract?.signed === true &&
            data.limits?.some((limit) => limit.key === "campaignRecipients" && limit.limit === 75),
        ),
    );

    jar = await resetWorkspaceDataState(base, jar);
  });

  await step("workspace danger", async () => {
    const mainSession = await request(base, jar, "GET", "/api/auth/session");
    const mainSessionData = await expectJson(
      "GET /api/auth/session for workspace danger",
      mainSession,
      200,
    );
    const homeWorkspaceId = mainSessionData.data.workspace.id;

    const mainDanger = await request(base, jar, "GET", "/api/workspaces/danger");
    await expectJson("GET /api/workspaces/danger main", mainDanger, 200, (data) =>
      Boolean(
        data.canLeave === false &&
          data.canDelete === true &&
          data.isOwner === true &&
          data.workspaceCount >= 2,
      ),
    );

    const blockedLeave = await request(base, jar, "POST", "/api/workspaces/leave");
    await expectJson("POST /api/workspaces/leave blocked sole owner", blockedLeave, 403);

    const memberWorkspace = mainSessionData.data.workspaces.find(
      (workspace) => workspace.role === "member" && workspace.id !== homeWorkspaceId,
    );

    if (memberWorkspace) {
      const switched = await switchWorkspace(
        base,
        jar,
        memberWorkspace.id,
        "POST /api/auth/workspace for workspace danger",
      );
      jar = switched.jar;

      const memberDanger = await request(base, jar, "GET", "/api/workspaces/danger");
      await expectJson("GET /api/workspaces/danger member", memberDanger, 200, (data) =>
        Boolean(data.canLeave === true && data.canDelete === false),
      );

      const left = await request(base, jar, "POST", "/api/workspaces/leave");
      const leftData = await expectJson("POST /api/workspaces/leave member", left, 200);
      jar = leftData.jar;

      const afterLeave = await request(base, jar, "GET", "/api/auth/session");
      await expectJson("GET /api/auth/session after leave member", afterLeave, 200, (data) =>
        Boolean(
          data.workspace.id === homeWorkspaceId &&
            !data.workspaces.some((workspace) => workspace.id === memberWorkspace.id),
        ),
      );
    }

    const created = await request(base, jar, "POST", "/api/workspaces", {
      name: "Smoke Delete Workspace",
      domain: `smoke-delete-${Date.now()}.example.com`,
    });
    const createdData = await expectJson("POST /api/workspaces for danger delete", created, 200);
    jar = createdData.jar;
    const tempWorkspaceId = createdData.data.workspace.id;

    const deleteResult = await request(base, jar, "DELETE", "/api/workspaces");
    const deleteData = await expectJson("DELETE /api/workspaces", deleteResult, 200, (data) =>
      Boolean(
        data.action === "delete" &&
          data.workspace?.id !== tempWorkspaceId &&
          !data.workspaces.some((workspace) => workspace.id === tempWorkspaceId),
      ),
    );
    jar = deleteData.jar;

    const restored = await switchWorkspace(
      base,
      jar,
      homeWorkspaceId,
      "POST /api/auth/workspace restore after danger delete",
    );
    jar = restored.jar;
  });

  await step("search", async () => {
    const result = await request(base, jar, "GET", "/api/search?q=inbox");
    await expectJson("GET /api/search", result, 200, (data) =>
      data.query === "inbox" &&
      (data.conversations.length > 0 ||
        data.contacts.length > 0 ||
        data.settings.length > 0 ||
        data.navigation.length > 0),
    );
  });

  await step("create workspace", async () => {
    const before = await request(base, jar, "GET", "/api/auth/session");
    const beforeData = await expectJson("GET /api/auth/session before create", before, 200);
    const homeWorkspaceId = beforeData.data.workspace.id;

    const created = await request(base, jar, "POST", "/api/workspaces", {
      name: "Smoke Test Shop",
      domain: `smoke-${Date.now()}.example.com`,
    });
    const createdChecked = await expectJson("POST /api/workspaces", created, 200, (data) =>
      Boolean(data.workspace?.name === "Smoke Test Shop" && Array.isArray(data.workspaces)),
    );
    jar = createdChecked.jar;

    const session = await request(base, jar, "GET", "/api/auth/session");
    await expectJson("GET /api/auth/session after create", session, 200, (data) =>
      Boolean(
        data.workspace?.name === "Smoke Test Shop" &&
          data.workspaces.some((workspace) => workspace.name === "Smoke Test Shop"),
      ),
    );

    const restore = await request(base, jar, "POST", "/api/auth/workspace", {
      workspaceId: homeWorkspaceId,
    });
    const restored = await expectJson("POST /api/auth/workspace after create", restore, 200);
    jar = restored.jar;
  });

  await step("availability schedule", async () => {
    const profile = await request(base, jar, "GET", "/api/auth/availability-schedule");
    await expectJson("GET /api/auth/availability-schedule", profile, 200, (data) =>
      Boolean(
        Array.isArray(data.schedule?.days) &&
          data.schedule.days.length >= 6 &&
          data.schedule?.timezone === "UTC+05:00",
      ),
    );

    const enable = await request(base, jar, "PATCH", "/api/settings/account/availability", {
      key: "0-2",
      on: true,
    });
    await expectJson("PATCH availability schedule enabled", enable, 200, (data) =>
      Boolean(data.on === true && data.schedule?.enabled === true),
    );

    const updated = await request(base, jar, "PATCH", "/api/auth/availability-schedule", {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      start: "10:00",
      end: "18:00",
    });
    await expectJson("PATCH /api/auth/availability-schedule", updated, 200, (data) =>
      Boolean(
        data.schedule?.days.length === 5 &&
          data.schedule?.start === "10:00" &&
          data.schedule?.end === "18:00",
      ),
    );

    const settings = await request(base, jar, "GET", "/api/settings/account/availability");
    await expectJson("GET /api/settings/account/availability schedule", settings, 200, (data) =>
      Boolean(data.schedule?.start === "10:00" && data.toggles?.["0-2"] === true),
    );

    const restore = await request(base, jar, "PATCH", "/api/auth/availability-schedule", {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      start: "09:00",
      end: "17:00",
    });
    await request(base, jar, "PATCH", "/api/settings/account/availability", {
      key: "0-2",
      on: false,
    });
    await expectJson("PATCH /api/auth/availability-schedule restore", restore, 200);
  });

  await step("workspace profile", async () => {
    const profile = await request(base, jar, "GET", "/api/workspaces/profile");
    await expectJson("GET /api/workspaces/profile", profile, 200, (data) =>
      Boolean(
        data.profile?.name &&
          data.profile?.domain &&
          data.workspace?.name === data.profile.name,
      ),
    );

    const updated = await request(base, jar, "PATCH", "/api/workspaces/profile", {
      name: "FashionSis QA",
    });
    const updatedChecked = await expectJson("PATCH /api/workspaces/profile", updated, 200, (data) =>
      Boolean(data.profile?.name === "FashionSis QA" && data.workspace?.name === "FashionSis QA"),
    );
    jar = updatedChecked.jar;

    const session = await request(base, jar, "GET", "/api/auth/session");
    await expectJson("GET /api/auth/session after workspace profile", session, 200, (data) =>
      Boolean(data.workspace?.name === "FashionSis QA"),
    );

    const logoBytes = readFileSync(path.join(root, "public/images/fashionsis-workspace.jpg"));
    const formData = new FormData();
    formData.append("logo", new Blob([logoBytes], { type: "image/jpeg" }), "logo.jpg");
    const uploaded = await requestMultipart(base, jar, "POST", "/api/workspaces/logo", formData);
    const uploadedChecked = await expectJson("POST /api/workspaces/logo", uploaded, 200, (data) =>
      Boolean(data.logoUrl && data.workspace?.logoUrl === data.logoUrl),
    );
    jar = uploadedChecked.jar;

    const removed = await request(base, jar, "DELETE", "/api/workspaces/logo");
    await expectJson("DELETE /api/workspaces/logo", removed, 200, (data) =>
      Boolean(data.logoUrl === null),
    );

    const restored = await request(base, jar, "PATCH", "/api/workspaces/profile", {
      name: "FashionSis",
    });
    const restoredChecked = await expectJson(
      "PATCH /api/workspaces/profile restore",
      restored,
      200,
      (data) => Boolean(data.profile?.name === "FashionSis"),
    );
    jar = restoredChecked.jar;
  });

  await step("account profile", async () => {
    const profile = await request(base, jar, "GET", "/api/auth/profile");
    const profileChecked = await expectJson("GET /api/auth/profile", profile, 200, (data) =>
      Boolean(
        data.profile?.firstName === "Nisar" &&
          data.profile?.lastName === "Ali" &&
          data.profile?.email === SEED_EMAIL,
      ),
    );
    jar = profileChecked.jar;

    if (profileChecked.data.profile?.emailVerified === false) {
      const verificationRequest = await request(base, jar, "POST", "/api/auth/verify-email/request");
      const verificationRequestChecked = await expectJson(
        "POST /api/auth/verify-email/request",
        verificationRequest,
        200,
        (data) => Boolean(data.ok && data.verifyUrl && data.emailDispatched === true),
      );
      jar = verificationRequestChecked.jar;

      const verifyToken = new URL(verificationRequestChecked.data.verifyUrl).searchParams.get(
        "token",
      );
      if (!verifyToken) {
        throw new Error("Verification token missing from verifyUrl");
      }

      const tokenValid = await request(
        base,
        jar,
        "GET",
        `/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
      );
      await expectJson("GET /api/auth/verify-email", tokenValid, 200, (data) =>
        Boolean(data.valid),
      );

      const verified = await request(base, jar, "POST", "/api/auth/verify-email", {
        token: verifyToken,
      });
      await expectJson("POST /api/auth/verify-email", verified, 200, (data) => Boolean(data.ok));

      const verifiedProfile = await request(base, jar, "GET", "/api/auth/profile");
      await expectJson("GET /api/auth/profile after verify", verifiedProfile, 200, (data) =>
        Boolean(data.profile?.emailVerified === true && data.user?.emailVerified === true),
      );
    }

    const updated = await request(base, jar, "PATCH", "/api/auth/profile", {
      firstName: "Nisar",
      lastName: "Tester",
    });
    const updatedChecked = await expectJson("PATCH /api/auth/profile", updated, 200, (data) =>
      Boolean(data.profile?.lastName === "Tester" && data.user?.name === "Nisar Tester"),
    );
    jar = updatedChecked.jar;

    const session = await request(base, jar, "GET", "/api/auth/session");
    await expectJson("GET /api/auth/session after profile", session, 200, (data) =>
      Boolean(data.user?.name === "Nisar Tester" && data.user?.lastName === "Tester"),
    );

    const restored = await request(base, jar, "PATCH", "/api/auth/profile", {
      firstName: "Nisar",
      lastName: "Ali",
    });
    const restoredChecked = await expectJson("PATCH /api/auth/profile restore", restored, 200, (data) =>
      Boolean(data.profile?.lastName === "Ali" && data.user?.name === "Nisar Ali"),
    );
    jar = restoredChecked.jar;

    const avatarBytes = readFileSync(path.join(root, "public/images/avatars/operator-nisar.jpg"));
    const avatarForm = new FormData();
    avatarForm.append("avatar", new Blob([avatarBytes], { type: "image/jpeg" }), "avatar.jpg");
    const uploaded = await requestMultipart(base, jar, "POST", "/api/auth/avatar", avatarForm);
    const uploadedChecked = await expectJson("POST /api/auth/avatar", uploaded, 200, (data) =>
      Boolean(data.avatarUrl && data.user?.avatarUrl === data.avatarUrl),
    );
    jar = uploadedChecked.jar;

    const sessionWithAvatar = await request(base, jar, "GET", "/api/auth/session");
    await expectJson("GET /api/auth/session after avatar upload", sessionWithAvatar, 200, (data) =>
      Boolean(data.user?.avatarUrl),
    );

    const removed = await request(base, jar, "DELETE", "/api/auth/avatar");
    await expectJson("DELETE /api/auth/avatar", removed, 200, (data) =>
      Boolean(data.avatarUrl === null && data.user?.avatarUrl === null),
    );
    jar = removed.jar;
  });

  const TEMP_PASSWORD = "fashionsis-qa-temp";

  await step("change password", async () => {
    const wrongCurrent = await request(base, jar, "POST", "/api/auth/change-password", {
      currentPassword: "wrong-password",
      newPassword: TEMP_PASSWORD,
    });
    await expectStatus("POST /api/auth/change-password wrong current", wrongCurrent, 401);

    const changed = await request(base, jar, "POST", "/api/auth/change-password", {
      currentPassword: SEED_PASSWORD,
      newPassword: TEMP_PASSWORD,
    });
    await expectJson("POST /api/auth/change-password", changed, 200, (data) => Boolean(data.ok));

    const oldLogin = await request(base, new Map(), "POST", "/api/auth/login", {
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
    });
    await expectStatus("POST /api/auth/login old password rejected", oldLogin, 401);

    const newLogin = await request(base, new Map(), "POST", "/api/auth/login", {
      email: SEED_EMAIL,
      password: TEMP_PASSWORD,
      remember: true,
    });
    const newLoginChecked = await expectJson("POST /api/auth/login new password", newLogin, 200, (data) =>
      Boolean(data.user?.email === SEED_EMAIL),
    );
    jar = newLoginChecked.jar;

    const restored = await request(base, jar, "POST", "/api/auth/change-password", {
      currentPassword: TEMP_PASSWORD,
      newPassword: SEED_PASSWORD,
    });
    const restoredChecked = await expectJson(
      "POST /api/auth/change-password restore",
      restored,
      200,
      (data) => Boolean(data.ok),
    );
    jar = restoredChecked.jar;
  });

  await step("forgot password", async () => {
    const result = await request(base, jar, "POST", "/api/auth/forgot-password", {
      email: SEED_EMAIL,
    });
    await expectJson("POST /api/auth/forgot-password", result, 200, (data) =>
      Boolean(data.ok && data.message && data.emailDispatched === true),
    );
  });

  await step("logout", async () => {
    const result = await request(base, jar, "POST", "/api/auth/logout");
    await expectStatus("POST /api/auth/logout", result, 200);
    jar = result.jar;
  });

  await step("session after logout", async () => {
    const result = await request(base, jar, "GET", "/api/auth/session");
    await expectStatus("GET /api/auth/session after logout", result, 401);
  });

  console.log(`\nAPI smoke passed: ${tests.length}/${tests.length} checks.`);
  return tests.length;
}

async function runStandalone() {
  const externalBase = process.env.SMOKE_BASE_URL?.replace(/\/$/, "");
  const port = externalBase ? null : await getFreePort();
  const base = externalBase ?? `http://127.0.0.1:${port}`;

  let server = null;
  if (!externalBase) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await new Promise((resolve, reject) => {
          const seed = spawn("npm", ["run", "db:seed"], {
            cwd: root,
            stdio: "pipe",
            shell: true,
          });
          let stderr = "";
          seed.stderr.on("data", (chunk) => {
            stderr += chunk;
          });
          seed.on("exit", (code) => {
            if (code === 0) {
              resolve();
              return;
            }
            reject(new Error(stderr.trim() || `db:seed exited with code ${code}`));
          });
        });
        break;
      } catch (error) {
        if (attempt === 4) throw error;
        await wait(1000);
      }
    }

    const standaloneServer = path.join(root, ".next", "standalone", "server.js");
    server = spawn("node", [standaloneServer], {
      cwd: root,
      stdio: "pipe",
      env: {
        ...process.env,
        PORT: String(port),
        HOSTNAME: "127.0.0.1",
        DATABASE_PATH: process.env.DATABASE_PATH ?? path.join(root, "data", "bybelt.db"),
        SESSION_SECRET: process.env.SESSION_SECRET ?? "smoke-test-secret",
        EMAIL_VERIFICATION_DEBUG: process.env.EMAIL_VERIFICATION_DEBUG ?? "1",
        EMAIL_TRANSPORT: process.env.EMAIL_TRANSPORT ?? "log",
      },
    });
    await waitForServer(base);
  }

  try {
    await runApiSmoke(base);
  } finally {
    if (server) {
      server.kill("SIGTERM");
      await wait(300);
    }
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  runStandalone().catch((error) => {
    console.error(`\nAPI smoke failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  });
}
