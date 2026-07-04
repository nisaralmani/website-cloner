import { NextResponse } from "next/server";
import { changePasswordForUser } from "@/lib/auth/change-password";
import { requireSession } from "@/lib/auth/request";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "currentPassword and newPassword are required" },
      { status: 400 },
    );
  }

  const result = await changePasswordForUser(session.user.id, currentPassword, newPassword);
  if ("error" in result) {
    const status = result.error === "Current password is incorrect" ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
