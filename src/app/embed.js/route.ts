import { getChatboxEmbedLoaderScript } from "@/lib/chatbox/embed-loader";

export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  return new Response(getChatboxEmbedLoaderScript(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
