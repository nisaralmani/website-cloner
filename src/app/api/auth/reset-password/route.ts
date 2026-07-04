import { NextResponse } from "next/server";
import {
  getValidResetToken,
  resetPasswordWithToken,
} from "@/lib/auth/password-reset";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const row = await getValidResetToken(token);
  return NextResponse.json({ valid: Boolean(row) });
}

export async function POST(request: Request) {
  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  const password = body.password ?? "";

  if (!token) {
    return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const updated = await resetPasswordWithToken(token, password);
  if (!updated) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
