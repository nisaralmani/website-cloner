#!/usr/bin/env node
const base = process.argv[2] ?? "https://chat.bybelt.com";
const loginEmail = process.argv[3] ?? "contact@fashionpara.com";
const loginPassword = process.argv[4] ?? "fashionsis-dev";
const jar = new Map();

function merge(setCookie) {
  if (!setCookie) return;
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const part of list) {
    const [pair] = part.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}

async function req(method, route, body) {
  const res = await fetch(`${base}${route}`, {
    method,
    headers: {
      ...(jar.size
        ? { Cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ") }
        : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = res.headers.getSetCookie?.();
  if (raw) merge(raw);
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  return { status: res.status, data, text: text.slice(0, 160) };
}

async function main() {
  const checks = [];
  const ok = (name, pass, detail = "") => {
    checks.push({ name, pass, detail });
    console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  };

  ok("GET /initiate/login", (await req("GET", "/initiate/login")).status === 200);
  ok("GET /en", (await req("GET", "/en")).status === 200);
  ok("GET /api/auth/session unauth", (await req("GET", "/api/auth/session")).status === 401);

  const login = await req("POST", "/api/auth/login", {
    email: loginEmail,
    password: loginPassword,
    remember: true,
  });
  ok(
    `POST /api/auth/login (${loginEmail})`,
    login.status === 200 && login.data?.user?.email,
    `${login.status} ${login.data?.error ?? login.data?.user?.email ?? login.text}`,
  );

  ok("GET /api/auth/session auth", (await req("GET", "/api/auth/session")).status === 200);

  const conversations = await req("GET", "/api/conversations");
  ok(
    "GET /api/conversations",
    conversations.status === 200 && conversations.data?.total >= 1,
    `total=${conversations.data?.total ?? "?"}`,
  );

  for (const route of [
    "/api/visitors",
    "/api/contacts",
    "/api/helpdesk",
    "/api/analytics?days=7",
    "/api/plugins",
    "/api/campaigns",
  ]) {
    const result = await req("GET", route);
    ok(`GET ${route}`, result.status === 200, String(result.status));
  }

  const exportCsv = await req("GET", "/api/contacts/export");
  ok(
    "GET /api/contacts/export",
    exportCsv.status === 200 && exportCsv.text.startsWith("Name,Email,"),
    String(exportCsv.status),
  );

  const chatbox = await req("POST", "/api/chatbox/sessions", { domain: "fashionsis.com" });
  ok(
    "POST /api/chatbox/sessions",
    chatbox.status === 201 || chatbox.status === 200,
    `${chatbox.status} ${chatbox.data?.sessionId ?? chatbox.data?.error ?? ""}`,
  );

  const failed = checks.filter((c) => !c.pass);
  console.log(`\nSummary: ${checks.length - failed.length}/${checks.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
