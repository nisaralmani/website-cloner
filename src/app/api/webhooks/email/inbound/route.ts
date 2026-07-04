import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { handlePostmarkInbound } from "@/lib/email/postmark-inbound";
import { secretsMatch } from "@/lib/security/constant-time";
import { logSecurityEventForRequest } from "@/lib/security/security-log";

export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  const expected = process.env.POSTMARK_INBOUND_SECRET;

  if (!expected) {
    return NextResponse.json(
      { ok: false, status: "not-configured", message: "POSTMARK_INBOUND_SECRET not set." },
      { status: 503 },
    );
  }
  if (!secretsMatch(secret, expected)) {
    logSecurityEventForRequest(request, {
      type: "invalid_webhook_signature",
      detail: "invalid postmark inbound secret",
    });
    return NextResponse.json({ ok: false, error: "invalid secret" }, { status: 401 });
  }

  const workspaceId = process.env.EMAIL_INGEST_WORKSPACE_ID?.trim();
  if (!workspaceId) {
    return NextResponse.json(
      { ok: false, error: "EMAIL_INGEST_WORKSPACE_ID not set" },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const db = await getDb();
  const result = await handlePostmarkInbound(db, workspaceId, payload as never);
  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }

  return NextResponse.json(result.body);
}
