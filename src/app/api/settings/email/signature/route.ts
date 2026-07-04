import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request";
import {
  getEmailSignatureText,
  isEmailSignatureEnabled,
  setEmailSignature,
} from "@/lib/email/signature-preferences";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = session.workspace.id;
  const [enabled, text] = await Promise.all([
    isEmailSignatureEnabled(workspaceId),
    getEmailSignatureText(workspaceId),
  ]);

  return NextResponse.json({ enabled, text });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { enabled?: boolean; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.enabled !== "boolean" || typeof body.text !== "string") {
    return NextResponse.json({ error: "enabled and text are required" }, { status: 400 });
  }

  const saved = await setEmailSignature(session.workspace.id, {
    enabled: body.enabled,
    text: body.text,
  });

  return NextResponse.json(saved);
}
