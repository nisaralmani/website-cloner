import { NextResponse } from "next/server";
import {
  getValidVerificationToken,
  verifyEmailWithToken,
} from "@/lib/auth/email-verification";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const row = await getValidVerificationToken(token);
  return NextResponse.json({ valid: Boolean(row) });
}

export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
  }

  const verified = await verifyEmailWithToken(token);
  if (!verified) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
