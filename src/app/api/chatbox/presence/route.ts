import { NextResponse } from "next/server";
import { clientIpFromRequest } from "@/lib/visitors/geo";
import { recordBrowsingPresence } from "@/lib/visitors/presence-store";

type Body = {
  workspaceId?: string;
  visitorId?: string;
  page?: string;
  title?: string;
  referrer?: string;
  name?: string;
  email?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.workspaceId?.trim() || !body.visitorId?.trim()) {
    return NextResponse.json({ error: "workspaceId and visitorId are required" }, { status: 400 });
  }

  await recordBrowsingPresence({
    workspaceId: body.workspaceId.trim(),
    visitorId: body.visitorId.trim(),
    page: body.page,
    title: body.title,
    referrer: body.referrer,
    ip: clientIpFromRequest(request),
    ua: request.headers.get("user-agent") ?? "",
    name: body.name,
    email: body.email,
  });

  return NextResponse.json({ ok: true });
}
