import { NextResponse } from "next/server";
import { DEFAULT_CAMPAIGN_TAGS, filterCampaignTags } from "@/lib/campaign-tags";
import { requireSession } from "@/lib/auth/request";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const tags = filterCampaignTags(DEFAULT_CAMPAIGN_TAGS, query);

  return NextResponse.json({ tags, total: tags.length });
}
