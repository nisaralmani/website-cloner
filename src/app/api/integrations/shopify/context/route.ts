import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request";
import { fetchShopifyCustomerContext } from "@/lib/integrations/shopify-context";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = new URL(request.url).searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const context = await fetchShopifyCustomerContext(session.workspace.id, email);
  if (!context) {
    return NextResponse.json(
      { error: "Shopify integration unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.json(context);
}
