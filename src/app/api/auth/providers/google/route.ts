import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request";
import { unlinkOAuthAccount } from "@/lib/auth/google-user";

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const password = body.password ?? "";
  if (!password) {
    return NextResponse.json({ error: "password is required" }, { status: 400 });
  }

  const result = await unlinkOAuthAccount(session.user.id, "google", password);
  if (!result.ok) {
    if ("reason" in result && result.reason === "not_linked") {
      return NextResponse.json({ error: "Google account is not linked" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
