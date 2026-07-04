import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request";
import { fetchShopifyWorkspaceStatus } from "@/lib/integrations/shopify-context";

export async function GET() {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await fetchShopifyWorkspaceStatus(session.workspace.id);
  if (!status) {
    return NextResponse.json(
      { linked: false, available: false as const },
    );
  }

  return NextResponse.json({ ...status, available: true as const });
}
