import { NextResponse } from "next/server";
import { isOAuthLinkedForUser } from "@/lib/auth/google-user";
import { isGoogleAuthConfigured } from "@/lib/auth/google";
import { requireSession } from "@/lib/auth/request";

export async function GET() {
  const session = await requireSession();
  const googleLinked = session?.user
    ? await isOAuthLinkedForUser(session.user.id, "google")
    : false;

  return NextResponse.json({
    google: isGoogleAuthConfigured(),
    googleLinked,
  });
}
